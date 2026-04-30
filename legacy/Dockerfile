# Immagine base nginx Alpine (leggera e production-ready)
FROM nginx:alpine

# Configurazione nginx personalizzata
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia tutti i file della webapp (config.js si ottiene dall'esempio se non presente)
COPY index.html config.js style.css LICENSE logo.png /usr/share/nginx/html/
COPY code/ /usr/share/nginx/html/code/
COPY DATA/ /usr/share/nginx/html/DATA/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
