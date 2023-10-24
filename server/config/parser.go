package config

import (
	"os"
	"sync"

	"gopkg.in/yaml.v3"
)

var lock sync.Mutex

type Config struct {
	Port            int    `yaml:"port"`
	DownloadPath    string `yaml:"downloadPath"`
	DownloaderPath  string `yaml:"downloaderPath"`
	RequireAuth     bool   `yaml:"require_auth"`
	Username        string `yaml:"username"`
	Password        string `yaml:"password"`
	QueueSize       int    `yaml:"queue_size"`
	SessionFilePath string `yaml:"session_file_path"`
}

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

var instance *Config

func Instance() *Config {
	if instance == nil {
		lock.Lock()
		defer lock.Unlock()
		if instance == nil {
			instance = &Config{}
		}
	}
	return instance
}
