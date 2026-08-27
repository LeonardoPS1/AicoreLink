import bcrypt
password = b'dev123456'
hashed = b'$2a$12$vxHGVBjcHWF1OhItKw4toeZSiDzanQ5lB8gS/q4PQb.BSh.1QA/FW'
result = bcrypt.checkpw(password, hashed)
print('Password match:', result)