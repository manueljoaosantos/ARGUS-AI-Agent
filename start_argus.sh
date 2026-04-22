xfce4-terminal \
--tab -T "n8n" -e "bash -i -c 'cd /home/manuel/ARGUS-AI-Agent && N8N_HOST=0.0.0.0 N8N_SECURE_COOKIE=false N8N_CORS_ALLOW_ORIGIN=http://192.168.1.70:8000 n8n start; exec bash'" \
--tab -T "flowise" -e "bash -i -c 'cd /home/manuel/ARGUS-AI-Agent && flowise start; exec bash'" \
--tab -T "backend" -e "bash -i -c 'cd /home/manuel/ARGUS-AI-Agent/backend && node server.js; exec bash'" \
--tab -T "ngrok" -e "bash -i -c 'cd /home/manuel/ARGUS-AI-Agent && ngrok http 5678; exec bash'"
