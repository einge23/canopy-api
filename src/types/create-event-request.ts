export interface CreateEventRequest {
    name: string;
    start: Date;
    end: Date;
    location?: string;
    description?: string;
    user_id: string;
    color: string;
    recurrence_rule?: string;
}
