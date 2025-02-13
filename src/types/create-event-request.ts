export interface CreateEventRequest {
    name: string;
    start: Date;
    end: Date;
    location: string;
    description: string;
    user_id: number;
    color: string;
    recurrence_rule?: string;
}
