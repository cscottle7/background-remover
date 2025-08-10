#!/usr/bin/env python3
import subprocess
import sys
import os

def run_investigation():
    print("Installing required packages...")
    
    # Install requirements
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", 
            "-r", "requirements_investigation.txt"
        ])
        print("✓ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return
    
    # Change to project directory
    os.chdir(r"C:\Users\cscot\Documents\Apps\Remove background")
    
    # Run investigation
    try:
        subprocess.check_call([sys.executable, "investigate_deployment.py"])
    except subprocess.CalledProcessError as e:
        print(f"❌ Investigation failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    run_investigation()