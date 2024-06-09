package config

import (
	"os"
	"sync"

	"gopkg.in/yaml.v3"
)

type Config struct {
	CurrentLogFile  string
	LogPath         string `yaml:"log_path"`
	BaseURL         string `yaml:"base_url"`
	Host            string `yaml:"host"`
	Port            int    `yaml:"port"`
	DownloadPath    string `yaml:"downloadPath"`
	DownloaderPath  string `yaml:"downloaderPath"`
	RequireAuth     bool   `yaml:"require_auth"`
	Username        string `yaml:"username"`
	Password        string `yaml:"password"`
	QueueSize       int    `yaml:"queue_size"`
	SessionFilePath string `yaml:"session_file_path"`
}

var (
	instance     *Config
	instanceOnce sync.Once
)

func Instance() *Config {
	if instance == nil {
		instanceOnce.Do(func() {
			instance = &Config{}
		})
	}
	return instance
}

// Initialises the Config struct given its config file
func (c *Config) LoadFile(filename string) error {
	fd, err := os.Open(filename)
	if err != nil {
		return err
	}

	if err := yaml.NewDecoder(fd).Decode(c); err != nil {
		return err
	}

	return nil
}
