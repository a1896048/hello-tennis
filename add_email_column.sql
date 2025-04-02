ALTER TABLE users ADD COLUMN email TEXT; ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
