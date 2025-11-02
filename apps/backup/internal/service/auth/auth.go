package auth

import (
	"time"

	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/service/users"
)

const (
	maxSessionAge = time.Hour * 12
)

type Service struct {
	env          config.Env
	dbgen        *dbgen.Queries
	UsersService *users.Service
}

func New(env config.Env, dbgen *dbgen.Queries, usersService *users.Service) *Service {
	return &Service{
		env:          env,
		dbgen:        dbgen,
		UsersService: usersService,
	}
}
