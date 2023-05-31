package config

import (
	"os"
	"sync"

	"gopkg.in/yaml.v3"
)

var lock sync.Mutex

type serverConfig struct {
	Port           int    `yaml:"port"`
	DownloadPath   string `yaml:"downloadPath"`
	DownloaderPath string `yaml:"downloaderPath"`
}

type config struct {
	cfg serverConfig
}

func (c *config) LoadFromFile(filename string) (serverConfig, error) {
	bytes, err := os.ReadFile(filename)
	if err != nil {
		return serverConfig{}, err
	}

	yaml.Unmarshal(bytes, &c.cfg)

	return c.cfg, nil
}

func (c *config) GetConfig() serverConfig {
	return c.cfg
}

func (c *config) SetPort(port int) {
	c.cfg.Port = port
}

func (c *config) DownloadPath(path string) {
	c.cfg.DownloadPath = path
}

func (c *config) DownloaderPath(path string) {
	c.cfg.DownloaderPath = path
}

var instance *config

func Instance() *config {
	if instance == nil {
		lock.Lock()
		defer lock.Unlock()
		if instance == nil {
			instance = &config{serverConfig{}}
		}
	}
	return instance
}
