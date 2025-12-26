export const getDeviceUUID = (): string => {
    const STORAGE_KEY = 'votemap_device_uuid';

    if (typeof window === 'undefined') {
        return '';
    }

    let uuid = localStorage.getItem(STORAGE_KEY);

    if (!uuid) {
        uuid = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, uuid);
    }

    return uuid;
};
