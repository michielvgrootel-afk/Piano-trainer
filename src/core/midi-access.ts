import { MidiDevice, MidiInputEvent } from '../types';

type MidiEventCallback = (event: MidiInputEvent) => void;
type DeviceChangeCallback = (devices: MidiDevice[]) => void;

class MidiAccess {
  private midiAccess: MIDIAccess | null = null;
  private activeInput: MIDIInput | null = null;
  private noteCallbacks: MidiEventCallback[] = [];
  private deviceCallbacks: DeviceChangeCallback[] = [];
  private devices: MidiDevice[] = [];

  async initialize(): Promise<boolean> {
    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.midiAccess.onstatechange = () => this.refreshDevices();
      this.refreshDevices();
      // Auto-connect to first available device
      if (this.devices.length > 0) {
        this.connect(this.devices[0].id);
      }
      return true;
    } catch (err) {
      console.warn('Web MIDI API not available:', err);
      return false;
    }
  }

  private refreshDevices() {
    if (!this.midiAccess) return;

    this.devices = [];
    this.midiAccess.inputs.forEach((input) => {
      this.devices.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || 'Unknown',
        connected: input.state === 'connected',
      });
    });

    this.deviceCallbacks.forEach((cb) => cb(this.devices));
  }

  connect(deviceId: string): boolean {
    if (!this.midiAccess) return false;

    // Disconnect current
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }

    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) return false;

    this.activeInput = input;
    this.activeInput.onmidimessage = (msg) => this.handleMidiMessage(msg);
    return true;
  }

  private handleMidiMessage(msg: MIDIMessageEvent) {
    if (!msg.data || msg.data.length < 3) return;

    const status = msg.data[0] & 0xf0;
    const note = msg.data[1];
    const velocity = msg.data[2];

    let type: 'noteon' | 'noteoff' | null = null;

    if (status === 0x90 && velocity > 0) {
      type = 'noteon';
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      type = 'noteoff';
    }

    if (type) {
      const event: MidiInputEvent = {
        note,
        velocity,
        timestamp: performance.now(),
        type,
      };
      this.noteCallbacks.forEach((cb) => cb(event));
    }
  }

  onNote(callback: MidiEventCallback) {
    this.noteCallbacks.push(callback);
    return () => {
      this.noteCallbacks = this.noteCallbacks.filter((cb) => cb !== callback);
    };
  }

  onDeviceChange(callback: DeviceChangeCallback) {
    this.deviceCallbacks.push(callback);
    // Immediately fire with current devices
    callback(this.devices);
    return () => {
      this.deviceCallbacks = this.deviceCallbacks.filter((cb) => cb !== callback);
    };
  }

  getDevices(): MidiDevice[] {
    return this.devices;
  }

  getActiveDevice(): MidiDevice | null {
    if (!this.activeInput) return null;
    return this.devices.find((d) => d.id === this.activeInput!.id) || null;
  }

  disconnect() {
    if (this.activeInput) {
      this.activeInput.onmidimessage = null;
      this.activeInput = null;
    }
  }
}

export const midiAccess = new MidiAccess();
