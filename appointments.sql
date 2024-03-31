CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    vehicle_make VARCHAR(50) NOT NULL,
    vehicle_model VARCHAR(50) NOT NULL,
    vehicle_year INTEGER NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    additional_notes TEXT,
    creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    appointment_state VARCHAR(20) NOT NULL DEFAULT 'free' -- Add appointment_state field
);

