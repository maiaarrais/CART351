from flask import Flask, render_template

app = Flask(__name__)
@app.route("/")
def index():
    return render_template("pineapples.html")

@app.route("/another")
def another():
    return render_template("pineapples_two.html")

@app.route("/three")
def three():
    someNewVar = "strawberries"
    someNewList = ["one", "two", "three"]
    someDict = {"color": "yellow", "feature": "spiky", "taste": "sweet"}
    return render_template("pineapples_three.html", 
                           someHTMLVar = someNewVar,
                           someHTMLList = someNewList,
                           someHTMLDict = someDict)

app.run(debug=True)
