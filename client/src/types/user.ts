export interface User {
    _id: string;
    name: string;
    email: string;
    isOnline?: boolean;
    lastSeen?: Date;
}
