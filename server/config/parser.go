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
	RequireAuth    bool   `yaml:"require_auth"`
	RPCSecret      string `yaml:"rpc_secret"`
	QueueSize      int    `yaml:"queue_size"`
}

type config struct {
	cfg serverConfig
}

func (c *config) TryLoadFromFile(filename string) (serverConfig, error) {
	fd, err := os.Open(filename)
	if err != nil {
		return serverConfig{}, err
	}

	if err := yaml.NewDecoder(fd).Decode(&c.cfg); err != nil {
		return serverConfig{}, err
	}

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

func (c *config) RequireAuth(value bool) {
	c.cfg.RequireAuth = value
}

func (c *config) RPCSecret(secret string) {
	c.cfg.RPCSecret = secret
}

func (c *config) QueueSize(size int) {
	c.cfg.QueueSize = size
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
