# Project Sadar
## Register User
URL: '**/register**'

Method: '**POST**'

Deskripsi: 'Register a new User'

Request Body:
```
{
  'userName':String
  'email':String
  'password':String
  'role':String.ENUM('Driver','Customer')
  'fullName':String
  'tanggalLahir':date(contoh: 1990-01-01),
  'noHP':String
}
```
Success Response
```
{
    "status": "success",
    "message": "Register Successfull!",
    "token": <jwt token>
}
```
### Error Handling

Error: Kurang data dalam Request Body

statusCode: '400'
```
{
  status: "Error",
  message: `Data yang diperlukan belum lengkap: username, email, password, role, fullName, tanggalLahir, noHP`;
}
```

Error: Password panjangnya kurang dari 5

statusCode: '400'
```
{
  status: "Error",
  message: "Password harus memiliki minimal 5 karakter"
}
```

Error: Nomor HP panjangnya kurang dari 10

statusCode: 400
```
{
  status: "Error",
  message: "Nomor HP Anda tidak valid. Mohon cek kembali"
}
```

Error: Jika username, email, atau noHP sudah ada di database

statusCode: 409
```
{
 status: "Error",
message: "Username, email, atau noHP sudah dipakai. Mohon cek kembali"
}
```
Error: role yang dikirim tidak sesuai ENUM

statusCode:404
```
{
  status:"Error",
  messsage:"Role [role] belum terbuat"
}
```
---
## User Login
URL: '**/register**'

Method: '**POST**'

Deskripsi: 'Login User'

Request Body:
```
{
  'loginUser':String (userName || email)
  'password':String (Password)
}
```
Success Response
```
{
    "status": "success",
    "message": "Login Successfull!",
    "token": <jwt token>
}
```
### Error Handling

Error: Data yang dikirim tidak lengkap

statusCode: '400'
```
{
  status: "Error",
  message: `Data yang diperlukan belum lengkap: loginUser, password`;
}
```

Error: data tidak sesuai dengan database

statusCode: '404'
```
{
  status: "Error",
  message: "Salah akun atau password"
}
```
