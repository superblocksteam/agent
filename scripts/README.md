### Superblocks On-Premise-Agent Quickstart Deployment Script

##### Supported OS
- AmazonLinux
- Ubuntu
- CentOS
- Debian

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

##### Manual test for localhost
- Configure a VM instance with AmazonLinux/Ubuntu/CentOS/Debian
- Install the script
```
sudo curl -SL https://raw.githubusercontent.com/superblocksteam/agent/main/scripts/quickstart.sh -o /usr/bin/superblocks
sudo chmod +x /usr/bin/superblocks
```
- Configure agent key
```
sudo superblocks conf SUPERBLOCKS_AGENT_KEY [GET_YOUR_KEY_FROM_SUPERBLOCKS_APP]
```
- Start the agent (when staring for the first time, it will install docker and pull docker images)
```
sudo superblocks start
```
- Check if service is up
```
curl localhost:8020
```

##### Manual test for https
- Configure a VM instance with AmazonLinux/Ubuntu/CentOS/Debian
- Install the script(same commands as above)
- Configure agent key and other variables
```
sudo superblocks conf SUPERBLOCKS_AGENT_KEY [GET_YOUR_KEY_FROM_SUPERBLOCKS_APP]
sudo superblocks conf SUPERBLOCKS_LETSENCRYPT_EMAIL [YOUR_EMAIL_ADDRESS]
sudo superblocks conf SUPERBLOCKS_AGENT_HOST_URL https://YOUR.VALID.DOMAIN.COM
sudo superblocks conf SUPERBLOCKS_PROXY_REPLICA_COUNT 1
```
- Make sure a CNAME or A record of the custom domain is created and pointed to the VM instance
- Start the agent(as above)
- Check localhost
- Visit https://YOUR.VALID.DOMAIN.COM to validate is service is up for https

