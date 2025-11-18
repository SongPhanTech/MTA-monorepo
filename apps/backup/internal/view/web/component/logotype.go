package component

import (
	"github.com/eduardolat/pgbackweb/internal/config"
	"github.com/eduardolat/pgbackweb/internal/logger"
	nodx "github.com/nodxdev/nodxgo"
)

func Logotype() nodx.Node {
	env, err := config.GetEnv()
	if err != nil {
		logger.FatalError("error getting environment variables", logger.KV{"error": err})
	}
	return nodx.Div(
		nodx.ClassMap{
			"inline space-x-2 select-none":    true,
			"flex justify-start items-center": true,
		},
		nodx.Img(
			nodx.Class("w-[60px] h-auto"),
			nodx.Src(env.PBW_PREFIX+"/images/logo.png"),
			nodx.Alt("PG Back Web"),
		),
		nodx.SpanEl(
			nodx.Class("text-2xl font-bold"),
			nodx.Text("Sao lưu dữ liệu"),
		),
	)
}
