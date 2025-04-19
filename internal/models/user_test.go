package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestHashAndCheckPassword(t *testing.T) {
	u := User{Password: "password123"}
	err := u.HashPassword()
	assert.NoError(t, err, "HashPassword should not return error")
	assert.NotEqual(t, "password123", u.Password, "Password should be hashed and not equal to raw")


	err = u.CheckPassword("password123")
	assert.NoError(t, err, "CheckPassword should succeed for correct password")


	err = u.CheckPassword("wrongpassword")
	assert.Error(t, err, "CheckPassword should fail for incorrect password")
}
