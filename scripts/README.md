### Superblocks On-Premise-Agent Quickstart Deployment Script

##### Supported OS
- AmazonLinux
- Ubuntu

##### Install The Script
```
sudo curl -SL https://raw.githubusercontent.com/superblocksteam/agent/main/scripts/quickstart.sh -o /usr/bin/superblocks
sudo chmod +x /usr/bin/superblocks
```

##### Usage
Configuration
```
# Required
sudo superblocks conf SUPERBLOCKS_AGENT_KEY [GET_YOUR_KEY_FROM_SUPERBLOCKS_APP]

# In order to use custom domain and https
sudo superblocks conf SUPERBLOCKS_LETSENCRYPT_EMAIL [YOUR_EMAIL_ADDRESS]
sudo superblocks conf SUPERBLOCKS_AGENT_HOST_URL https://YOUR.VALID.DOMAIN.COM
sudo superblocks conf SUPERBLOCKS_PROXY_REPLICA_COUNT 1
```

Start Superblocks Agent
```
# Usage: sudo superblocks COMMAND
# Commands: [start/status/stop/conf/log]

sudo superblocks start

```
