import bcrypt
password = b'dev123456'
hashed = b'$2a$12$VRS1uVc2H5/CCr0i1P8UU.0a5SocdsTAslfi0Dne9h8AGLKSwWFlW'
result = bcrypt.checkpw(password, hashed)
print('Password match:', result)