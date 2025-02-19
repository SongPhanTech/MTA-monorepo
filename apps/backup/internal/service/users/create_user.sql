-- name: UsersServiceCreateUser :one
INSERT INTO users (id, name, email, password)
VALUES (@id, @name, lower(@email), @password)
RETURNING *;
