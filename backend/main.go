package main

import (
	"database/sql"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/go-sql-driver/mysql"

	"backend/internal/auth"
	"backend/internal/config"
	"backend/internal/httpx"
)

func main() {
	cfg, err := config.Load(os.Getenv)
	if err != nil {
		fatal("config", err)
	}

	dbCfg := mysql.NewConfig()
	dbCfg.User, dbCfg.Passwd, dbCfg.DBName = cfg.DBUser, cfg.DBPassword, cfg.DBName
	dbCfg.Net, dbCfg.Addr = "tcp", net.JoinHostPort(cfg.DBHost, cfg.DBPort)
	dbCfg.ParseTime, dbCfg.Loc = true, time.UTC
	db, err := sql.Open("mysql", dbCfg.FormatDSN())
	if err != nil {
		fatal("open db", err)
	}
	if err := db.Ping(); err != nil {
		fatal("ping db", err)
	}

	authH := auth.Handler{DB: db}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/auth/profile", authH.Profile)

	srv := &http.Server{
		Addr:              fmt.Sprintf(":%d", cfg.Port),
		Handler:           httpx.Log(mux),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	slog.Info("listening", "addr", srv.Addr)
	fatal("server", srv.ListenAndServe())
}

func fatal(what string, err error) {
	slog.Error(what, "err", err)
	os.Exit(1)
}
