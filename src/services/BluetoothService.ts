export const ZOO_SERVICE_UUID = "0000fff0-0000-1000-8000-00805f9b34fb";
export const WRITE_CHARACTERISTIC_UUID = "0000fff6-0000-1000-8000-00805f9b34fb";
export const BATTERY_SERVICE_UUID = 'battery_service';
export const BATTERY_LEVEL_CHARACTERISTIC_UUID = 'battery_level';

export interface BluetoothDevice {
    device: any;
    writeCharacteristic: any;
    batteryLevel?: number;
}

class BluetoothService {
    private static instance: BluetoothService;
    private device: BluetoothDevice | null = null;
    private onConnectedCallback: (() => void) | null = null;
    private onDisconnectedCallback: (() => void) | null = null;
    private onBatteryUpdateCallback: ((level: number) => void) | null = null;

    private constructor() {}

    public static getInstance(): BluetoothService {
        if (!BluetoothService.instance) {
            BluetoothService.instance = new BluetoothService();
        }
        return BluetoothService.instance;
    }

    public setCallbacks(callbacks: {
        onConnected?: () => void;
        onDisconnected?: () => void;
        onBatteryUpdate?: (level: number) => void;
    }) {
        this.onConnectedCallback = callbacks.onConnected || null;
        this.onDisconnectedCallback = callbacks.onDisconnected || null;
        this.onBatteryUpdateCallback = callbacks.onBatteryUpdate || null;
    }

    private handleBatteryLevelChanged = (event: any) => {
        const batteryLevel = event.target.value.getUint8(0);
        if (this.device) {
            this.device.batteryLevel = batteryLevel;
        }
        if (this.onBatteryUpdateCallback) {
            this.onBatteryUpdateCallback(batteryLevel);
        }
    };

    private onDisconnected = async () => {
        if (this.device) {
            this.device.writeCharacteristic = null;
        }
        if (this.onDisconnectedCallback) {
            this.onDisconnectedCallback();
        }
    };

    public async connect(): Promise<boolean> {
        try {
            const bleDevice = await navigator.bluetooth.requestDevice({ 
                filters: [{ services: [ZOO_SERVICE_UUID] }],
                optionalServices: [BATTERY_SERVICE_UUID]
            });

            bleDevice.addEventListener('gattserverdisconnected', this.onDisconnected);
            
            const server = await bleDevice.gatt.connect();
            
            // Main Control Service
            const service = await server.getPrimaryService(ZOO_SERVICE_UUID);
            const writeCharacteristic = await service.getCharacteristic(WRITE_CHARACTERISTIC_UUID);
            
            this.device = {
                device: bleDevice,
                writeCharacteristic
            };

            // Battery Service
            try {
                const batteryService = await server.getPrimaryService(BATTERY_SERVICE_UUID);
                const batteryLevelCharacteristic = await batteryService.getCharacteristic(BATTERY_LEVEL_CHARACTERISTIC_UUID);
                
                const initialBatteryLevel = await batteryLevelCharacteristic.readValue();
                this.handleBatteryLevelChanged({ target: { value: initialBatteryLevel } });

                await batteryLevelCharacteristic.startNotifications();
                batteryLevelCharacteristic.addEventListener('characteristicvaluechanged', this.handleBatteryLevelChanged);
            } catch (error) {
                console.log('Battery service not available');
            }

            if (this.onConnectedCallback) {
                this.onConnectedCallback();
            }

            return true;
        } catch (error) {
            console.error('Bluetooth connection failed:', error);
            return false;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.device && this.device.device.gatt.connected) {
            await this.device.device.gatt.disconnect();
        }
    }

    public isConnected(): boolean {
        return !!(this.device && this.device.device.gatt.connected);
    }

    public getDevice(): BluetoothDevice | null {
        return this.device;
    }

    public async setVibration(level: number): Promise<void> {
        if (!this.device?.writeCharacteristic) return;

        const VIBRATION_LEVELS = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 2, 18, 0, 0, 0, 0, 2, 18, 0, 0, 0],
            [0, 3, 17, 0, 0, 0, 0, 3, 17, 0, 0, 0],
            [0, 4, 16, 0, 0, 0, 0, 4, 16, 0, 0, 0],
            [0, 5, 15, 0, 0, 0, 0, 5, 15, 0, 0, 0],
            [0, 6, 14, 0, 0, 0, 0, 6, 14, 0, 0, 0],
            [0, 7, 13, 0, 0, 0, 0, 7, 13, 0, 0, 0],
            [0, 8, 12, 0, 0, 0, 0, 8, 12, 0, 0, 0],
            [0, 9, 11, 0, 0, 0, 0, 9, 11, 0, 0, 0],
            [0, 10, 10, 0, 0, 0, 0, 10, 10, 0, 0, 0],
            [0, 11, 9, 0, 0, 0, 0, 11, 9, 0, 0, 0],
            [0, 12, 8, 0, 0, 0, 0, 12, 8, 0, 0, 0],
            [0, 13, 7, 0, 0, 0, 0, 13, 7, 0, 0, 0],
            [0, 14, 6, 0, 0, 0, 0, 14, 6, 0, 0, 0],
            [0, 15, 5, 0, 0, 0, 0, 15, 5, 0, 0, 0],
            [0, 16, 4, 0, 0, 0, 0, 16, 4, 0, 0, 0],
            [0, 17, 3, 0, 0, 0, 0, 17, 3, 0, 0, 0],
            [0, 18, 2, 0, 0, 0, 0, 18, 2, 0, 0, 0],
            [0, 19, 1, 0, 0, 0, 0, 19, 1, 0, 0, 0],
            [0, 20, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0]
        ];

        try {
            const levelData = VIBRATION_LEVELS[level] || VIBRATION_LEVELS[0];
            const [p1_params, p2_params] = [levelData.slice(0, 6), levelData.slice(6, 12)];
            
            const buildMotorConfigCommand = (motorChar: string, params: number[]) => 
                new Uint8Array([0x70, motorChar.charCodeAt(0), 0x40, ...params]);
            
            const buildActivationCommand = (motorType: number) => 
                new Uint8Array([0x70, 't'.charCodeAt(0), 0x40, 0x23, motorType, 0, 0, 0, 0]);

            const [cmd_p1, cmd_p2, cmd_activate] = [
                buildMotorConfigCommand('1', p1_params),
                buildMotorConfigCommand('2', p2_params),
                buildActivationCommand(3)
            ];

            await this.device.writeCharacteristic.writeValue(cmd_p1);
            await new Promise(resolve => setTimeout(resolve, 1));
            await this.device.writeCharacteristic.writeValue(cmd_p2);
            await new Promise(resolve => setTimeout(resolve, 1));
            await this.device.writeCharacteristic.writeValue(cmd_activate);
        } catch (error) {
            console.error('Error setting vibration:', error);
        }
    }

    
}

export default BluetoothService;
