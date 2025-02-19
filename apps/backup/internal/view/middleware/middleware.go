package middleware

import (
	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/database/dbgen"
	"github.com/eduardolat/pgbackweb/internal/service"
)

type Middleware struct {
	servs *service.Service
	dbgen *dbgen.Queries
	env   config.Env
}

func New(servs *service.Service, dbgen *dbgen.Queries, env config.Env) *Middleware {
	return &Middleware{servs: servs, dbgen: dbgen, env: env}
}
