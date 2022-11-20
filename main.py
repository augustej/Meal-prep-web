from flaskr import create_app
from dotenv import load_dotenv
load_dotenv()
import os

app = create_app()

if __name__ == '__main__':
    app.run(port=7777, debug = True)
    