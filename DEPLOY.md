# Деплой RitmixLove на hoster.kz (VPS + Docker)

## 1. Подготовка VPS

```bash
# SSH на сервер
ssh root@<IP_ВАШЕГО_VPS>

# Обновление системы
apt update && apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Установка Docker Compose (plugin)
apt install -y docker-compose-plugin
```

## 2. Загрузка проекта

```bash
# Клонирование репозитория
cd /opt
git clone https://github.com/nullx137/landing_music.git
cd landing_music
```

## 3. Генерация .htpasswd (логин/пароль для /admin)

```bash
# Вариант A — если установлен htpasswd:
apt install -y apache2-utils
htpasswd -cb docker/.htpasswd admin ВАШ_ПАРОЛЬ

# Вариант B — без htpasswd (через openssl):
mkdir -p docker
HASH=$(openssl passwd -apr1 "ВАШ_ПАРОЛЬ")
echo "admin:${HASH}" > docker/.htpasswd
```

**Смена пароля:** удалите `docker/.htpasswd` и повторите команду выше с новым паролем.

## 4. Запуск

```bash
docker compose up -d --build
```

Проверка:
```bash
docker compose logs -f
curl -I http://localhost
```

## 5. SSL-сертификат (Let's Encrypt)

```bash
# Установка Certbot
apt install -y certbot

# Остановка nginx в контейнере (для порта 80)
docker compose stop web

# Получение сертификата
certbot certonly --standalone -d yourdomain.kz --agree-tos -m your@email.com

# Запуск контейнера обратно
docker compose start web
```

После получения сертификата добавьте в `docker-compose.yml` volume для сертификатов и обновите `nginx.conf` для SSL:

```yaml
volumes:
  - /etc/letsencrypt:/etc/letsencrypt:ro
```

В `nginx.conf` добавьте:
```nginx
server {
    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/yourdomain.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.kz/privkey.pem;
    # ... остальная конфигурация
}
```

## Полезные команды

```bash
docker compose logs -f          # логи
docker compose restart          # перезапуск
docker compose down             # остановка
docker compose exec web sh      # войти в контейнер
```

## Проверка

Откройте в браузере: `http://yourdomain.kz/admin/`
Введите логин/пароль из `.htpasswd`.
