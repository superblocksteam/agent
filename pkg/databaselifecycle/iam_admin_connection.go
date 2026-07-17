package databaselifecycle

import (
	"errors"
	"fmt"
	"math"
	"net"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

const defaultPostgresAdminDatabase = "postgres"

var postgresHostLabelPattern = regexp.MustCompile(`^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$`)
var postgresDatabasePattern = regexp.MustCompile(`^[a-z_][a-z0-9_]{0,62}$`)

type PostgresAdminConnection struct {
	Database       string
	Host           string
	Port           int
	SSLMode        string
	SSLRootCert    string
	TargetDatabase string
}

func postgresAdminConnectionFromVars(vars map[string]any) (PostgresAdminConnection, error) {
	database := defaultPostgresAdminDatabase
	if configured, exists := vars["postgres_admin_database"]; exists {
		var ok bool
		database, ok = configured.(string)
		if !ok {
			return PostgresAdminConnection{}, errors.New("database lifecycle IAM PGDATABASE must be a string")
		}
	}
	host, _ := vars["host"].(string)
	port, err := postgresPort(vars["port"])
	if err != nil {
		return PostgresAdminConnection{}, err
	}
	sslMode, _ := vars["postgres_sslmode"].(string)
	sslRootCert, _ := vars["postgres_sslrootcert"].(string)
	targetDatabase, _ := vars["database_name"].(string)
	connection := PostgresAdminConnection{
		Database:       database,
		Host:           host,
		Port:           port,
		SSLMode:        sslMode,
		SSLRootCert:    sslRootCert,
		TargetDatabase: targetDatabase,
	}
	if err := connection.Validate(); err != nil {
		return PostgresAdminConnection{}, err
	}
	return connection, nil
}

func (connection PostgresAdminConnection) Validate() error {
	if !validPostgresHost(connection.Host) {
		return errors.New("database lifecycle IAM PGHOST must be a valid hostname or IP address")
	}
	if connection.Port < 1 || connection.Port > 65535 {
		return errors.New("database lifecycle IAM PGPORT must be between 1 and 65535")
	}
	if !postgresDatabasePattern.MatchString(connection.Database) {
		return errors.New("database lifecycle IAM PGDATABASE must be a safe PostgreSQL identifier")
	}
	if !postgresDatabasePattern.MatchString(connection.TargetDatabase) {
		return errors.New("database lifecycle IAM target database must be a safe PostgreSQL identifier")
	}
	if connection.Database == connection.TargetDatabase {
		return errors.New("database lifecycle IAM PGDATABASE must be distinct from the target database")
	}
	if connection.SSLMode != sslModeVerifyFull {
		return fmt.Errorf("database lifecycle IAM PGSSLMODE must be %q", sslModeVerifyFull)
	}
	if connection.SSLRootCert == "" ||
		strings.ContainsRune(connection.SSLRootCert, '\x00') ||
		!filepath.IsAbs(connection.SSLRootCert) ||
		filepath.Clean(connection.SSLRootCert) != connection.SSLRootCert ||
		connection.SSLRootCert == string(filepath.Separator) {
		return errors.New("database lifecycle IAM PGSSLROOTCERT must be a clean, non-root absolute path")
	}
	return nil
}

func (connection PostgresAdminConnection) CommandEnvironment(credentials MasterCredentials) map[string]string {
	return map[string]string{
		"PGDATABASE":    connection.Database,
		"PGHOST":        connection.Host,
		"PGPASSWORD":    credentials.Password,
		"PGPORT":        strconv.Itoa(connection.Port),
		"PGSSLMODE":     connection.SSLMode,
		"PGSSLROOTCERT": connection.SSLRootCert,
		"PGUSER":        credentials.Username,
	}
}

func postgresPort(value any) (int, error) {
	switch typed := value.(type) {
	case int:
		return typed, nil
	case int32:
		return int(typed), nil
	case int64:
		if typed < math.MinInt || typed > math.MaxInt {
			return 0, errors.New("database lifecycle IAM PGPORT is outside the supported integer range")
		}
		return int(typed), nil
	case float64:
		if math.Trunc(typed) != typed || typed < math.MinInt || typed > math.MaxInt {
			return 0, errors.New("database lifecycle IAM PGPORT must be an integer")
		}
		return int(typed), nil
	default:
		return 0, errors.New("database lifecycle IAM PGPORT must be an integer")
	}
}

func validPostgresHost(host string) bool {
	if host == "" || len(host) > 253 || strings.TrimSpace(host) != host || strings.ContainsRune(host, '\x00') {
		return false
	}
	if net.ParseIP(host) != nil {
		return true
	}
	if strings.HasSuffix(host, ".") {
		host = strings.TrimSuffix(host, ".")
	}
	if host == "" {
		return false
	}
	for _, label := range strings.Split(host, ".") {
		if !postgresHostLabelPattern.MatchString(label) {
			return false
		}
	}
	return true
}
