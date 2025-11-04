# rainbowFile = open("files/rainbow.txt", "r") #Open file for reading 
# sampleFile = open ("files/sample_text.txt", "w") #open file for writing 
# out = rainbowFile.read(4)
# # print(out)
# rainbowFile.seek(0)
# out_2 = rainbowFile.read()
# print(out_2)
# outlines = rainbowFile.readlines()
# print (outlines)

# animalList = []
# for i in range (3):
#     a_name = input ("Enter animal: ")
#     animalList.append(a_name+"\n")

# sampleFile.writelines(animalList)
# rainbowFile.close()
# sampleFile.close()

# sampleFile_a = open ("files/sample_text.txt", "a") #open file for appending 
# nameList = []
# for i in range (3):
#     name = input("Type name: ")
#     nameList.append(name+"\n")
# sampleFile_a.writelines(nameList)
# sampleFile_a.close()

#JSON OPERATIONS**********************************************************

import json

# Read from file and parse JSON
# jsonFile = open("files/test.json", "r")
# data = json.load(jsonFile)
# print(data)
# print(type(data)) # a list of dictionaries 

# json_str = '{ "name":"maia", "fav_color":"blue", "fav_city":"Montreal"}'
# data_2 = json.loads(json_str)
# print(data_2["name"])

# data_toSave = {"name":"mandy", "fav_col":"blue", "fav_city":"winnipeg"}
# data_s =json.dumps (data_toSave, indent = 4)
# fileToOpen = open ("files/new_sample.json", "w")
# fileToOpen.write(data_s)

# data_toSave_2 = {"name":"mandy", "fav_col":"blue", "fav_city":["list",3,4,True,"abc"]}
# fileToOpen = open ("files/new_sample.json", "w")
# json.dump(data_toSave_2, fileToOpen, indent = 4)
# fileToOpen.close()

# Modifying JSON data in a file*****************************************

jsonFile = open("files/new_sample.json", "r+")
data = json.load(jsonFile)
print(data['fav_city'])
print(type(data['fav_city']))
# #go to beginning of file
jsonFile.seek(0)
data['fav_city'].append("another element")
data["newKey"] = 1234
#output to the file
json.dump(data,jsonFile, indent =4)