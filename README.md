## MANAGE SUBSCRIPTIONS
### SET UP MYSQL DATABASE

1. Установка MySQL | Install MySQL:
```bash
# Debian
sudo apt update && sudo apt install mysql-server

# Arch based distro
sudo pacman -Sy && sudo pacman -S mariadb

# macOS
brew install mysql
```

2. Настройка MySQL | Configure MySQL:
```bash
# Запуск службы Linux| Start service
sudo systemctl start mysql   # Linux
sudo systemctl enable mysql  # Linux
brew services start mysql    # macOS

# Безопасная установка | Secure installation
sudo mysql_secure_installation
```

3. Настройка базы данных | Configure Database:
```sql
CREATE DATABASE currency_db;
USE currency_db;

CREATE TABLE exchange_rates (
    Cur_ID           INT NOT NULL,
    Date             DATE NOT NULL,  
    Cur_Abbreviation VARCHAR(3) NOT NULL,
    Cur_Scale        INT NOT NULL,
    Cur_Name         VARCHAR(100) NOT NULL,
    Cur_OfficialRate DECIMAL(10,4) NOT NULL,
    PRIMARY KEY (Cur_ID, Date)
);
```
### Public Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `GET /api/plans` - Get all subscription plans
- `GET /api/plans/:id` - Get specific plan details
- `GET /api/plans/filter` - Filter plans by price

### Protected Endpoints (Require Authentication)
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/subscriptions` - Get user subscriptions
- `GET /api/subscriptions/active` - Get active subscription
- `POST /api/subscriptions` - Subscribe to a plan
- `PUT /api/subscriptions/:id/cancel` - Cancel subscription
- `PUT /api/subscriptions/:id/auto-renew` - Toggle auto-renewal
-`GET api/subscriptions/stats`-Get stats(NOW EMPTY)

### Admin Endpoints
- `POST /api/admin/plans` - Create new plan
- `PUT /api/admin/plans/:id` - Update existing plan
- `DELETE /api/admin/plans/:id` - Delete a plan

