import jwt
import datetime
import requests

def decode_jwt_token(token):
    """Decode JWT token without verification (for debugging)"""
    try:
        # Decode without verification to see the payload
        decoded = jwt.decode(token, options={"verify_signature": False})
        print("JWT Token Payload:")
        print(f"  Subject (sub): {decoded.get('sub')}")
        print(f"  Role: {decoded.get('role')}")
        print(f"  User ID: {decoded.get('id')}")
        print(f"  Issued At (iat): {decoded.get('iat')}")
        print(f"  Expires At (exp): {decoded.get('exp')}")
        
        # Convert timestamps to readable dates
        if decoded.get('iat'):
            iat_date = datetime.datetime.fromtimestamp(decoded['iat'])
            print(f"  Issued At (human): {iat_date}")
            
        if decoded.get('exp'):
            exp_date = datetime.datetime.fromtimestamp(decoded['exp'])
            print(f"  Expires At (human): {exp_date}")
            
            # Check if token is expired
            current_time = datetime.datetime.now()
            if current_time > exp_date:
                print("  ❌ TOKEN IS EXPIRED!")
                return False
            else:
                print("  ✅ TOKEN IS VALID!")
                return True
                
    except Exception as e:
        print(f"Error decoding token: {e}")
        return False

def test_login_and_get_new_token():
    """Test login endpoint to get a fresh token"""
    url = "http://localhost:8081/login"
    
    # Try with a test admin account
    login_data = {
        "email": "frsma@gmail.com",
        "motDePasse": "password123"  # You may need to adjust this
    }
    
    print("Testing login endpoint...")
    print(f"URL: {url}")
    print(f"Data: {login_data}")
    
    try:
        response = requests.post(url, json=login_data)
        print(f"\nLogin Response Status: {response.status_code}")
        print(f"Login Response: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            if 'jwtToken' in response_data:
                new_token = response_data['jwtToken']
                print(f"\n✅ Got new JWT token: {new_token}")
                return new_token
            else:
                print("❌ No JWT token in response")
        else:
            print("❌ Login failed")
            
    except Exception as e:
        print(f"❌ Error during login: {e}")
    
    return None

def test_excel_import_with_token(token):
    """Test Excel import with the given token"""
    print(f"\n=== Testing Excel Import with Token ===")
    
    # First decode the token to check validity
    if not decode_jwt_token(token):
        print("Token is invalid or expired, cannot proceed with Excel import test")
        return
    
    # Create a simple test Excel file
    import pandas as pd
    
    printer_data = {
        'marque': ['HP', 'Canon'],
        'modele': ['LaserJet Pro 400', 'PIXMA TR4500'],
        'numeroSerie': ['CN12345ABC', 'K12345XYZ'],
        'emplacement': ['Bureau 101', 'Salle de réunion A']
    }
    
    df = pd.DataFrame(printer_data)
    excel_file = 'test_printers.xlsx'
    df.to_excel(excel_file, index=False)
    
    # Test the Excel import endpoint
    url = "http://localhost:8081/api/Imprimante/import-excel"
    headers = {'Authorization': f'Bearer {token}'}
    
    with open(excel_file, 'rb') as f:
        files = {'file': f}
        data = {'contratId': 10}  # Using contract ID 10 as requested
        
        print(f"Testing Excel import...")
        print(f"URL: {url}")
        print(f"Contract ID: 10")
        
        try:
            response = requests.post(url, files=files, data=data, headers=headers)
            print(f"\nExcel Import Response Status: {response.status_code}")
            print(f"Excel Import Response: {response.text}")
            
            if response.status_code == 200:
                print("✅ Excel import successful!")
            else:
                print("❌ Excel import failed!")
                
        except Exception as e:
            print(f"❌ Error during Excel import: {e}")
    
    # Clean up
    import os
    if os.path.exists(excel_file):
        os.remove(excel_file)

if __name__ == "__main__":
    # The JWT token you provided
    provided_token = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJ1c2VySWQiOjMsInN1YiI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTc1MTI4OTMzMSwiZXhwIjoxNzUxMjkxMTMxfQ.b8Lua5fRD2CggOUwgY8wVPZEn5n7sWDulRlBVqgxHbY"
    
    print("=== JWT Token Analysis ===")
    token_valid = decode_jwt_token(provided_token)
    
    if token_valid:
        print("\nUsing provided token for Excel import test...")
        test_excel_import_with_token(provided_token)
    else:
        print("\nProvided token is expired. Attempting to get a new token...")
        new_token = test_login_and_get_new_token()
        
        if new_token:
            print("\nUsing new token for Excel import test...")
            test_excel_import_with_token(new_token)
        else:
            print("Could not obtain a valid token. Please check your credentials.")
