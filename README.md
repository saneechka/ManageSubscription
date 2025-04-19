##MANAGE SUBSCRIPTIONS

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

