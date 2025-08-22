interface BluetoothRequestDeviceFilter {
    services?: BluetoothServiceUUID[];
    name?: string;
    namePrefix?: string;
    manufacturerId?: number;
    serviceDataUUID?: BluetoothServiceUUID;
}

interface BluetoothRequestDeviceOptions {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: BluetoothServiceUUID[];
    acceptAllDevices?: boolean;
}

interface Navigator {
    bluetooth: {
        requestDevice(options: BluetoothRequestDeviceOptions): Promise<any>;
    };
}
