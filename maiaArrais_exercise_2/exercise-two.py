from flask import Flask,render_template, request
import os
app = Flask(__name__)


# the default route
@app.route("/")
def index():
      return render_template("base.html")

#*************************************************

#Task: Variables and JinJa Templates
@app.route("/t1")
def t1():
      the_topic = "donuts"
      number_of_donuts = 28
      donut_data= {
      "flavours":["Regular", "Chocolate", "Blueberry", "Devil's Food"],
      "toppings": ["None","Glazed","Sugar","Powdered Sugar",
                   "Chocolate with Sprinkles","Chocolate","Maple"]
                   }
      
      products = [
        {"flavour": "Regular",      "img": "donut_sprinkles.png"},
        {"flavour": "Chocolate",    "img": "donut_a.png"},
        {"flavour": "Blueberry",    "img": "donut_e.png"},
        {"flavour": "Devil's Food", "img": "donut_b.png"},
    ]
      
      icecream_flavors = ["Vanilla","Raspberry","Cherry", "Lemon"]
      return render_template("t1.html", topic=the_topic, num_donuts=number_of_donuts, flavours = donut_data["flavours"], toppings = donut_data["toppings"], icecreams = icecream_flavors, products = products)

#*************************************************

# Task: HTML Form get & Data 
@app.route("/t2")
def t2():
    return render_template("t2.html")

@app.route("/thank_you_t2")
def thank_you_t2():
    # Grab GET params (names must match the form fields)
    first = request.args.get("first", "").strip()
    second = request.args.get("second", "").strip()
    notes = request.args.get("notes", "").strip()

    # Combine into one long string
    combined = f"{first} {second} {notes}".strip()

    # Replace vowels with asterisks (case-insensitive)
    import re
    modified = re.sub(r"[aeiouAEIOU]", "*", combined)

    # Pass to the template
    return render_template("thankyou_t2.html", combined=combined, result=modified)

#*************************************************
app.run(debug=True)