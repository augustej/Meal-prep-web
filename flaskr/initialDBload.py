from .model import User, Role, Product, Foodtype, productMeasurements, Coursetype, Measurement, productFoodtypes
import csv, os
from . import db
from flask_sqlalchemy import SQLAlchemy
from  sqlalchemy.sql.expression import func, select

admin_email = os.getenv("ADMIN_EMAIL")
admin_user = User.query.filter_by(email = admin_email).first()
admin_role = Role(name='admin')
chef_role = Role(name='chef')
family_member_role=Role(name='family_member')
db.session.add(admin_role)
db.session.add(chef_role)
db.session.add(family_member_role)
admin_user.role_name = 'admin'
db.session.commit()

with open('flaskr/static/type.csv') as typefile:
    csv_type_reader = csv.reader(typefile, delimiter=",")
    for row in csv_type_reader:
        new_type = Foodtype(name=row[0])
        db.session.add(new_type)
    db.session.commit()

with open('flaskr/static/Measurement.csv') as measurementfile:
    csv_measur_reader = csv.reader(measurementfile, delimiter=",")
    for row in csv_measur_reader:
        new_measurement = Measurement(name=row[0])
        db.session.add(new_measurement)
    db.session.commit()

with open('flaskr/static/CourseType.csv') as coursetypefile:
    csv_course_reader = csv.reader(coursetypefile, delimiter=",")
    for row in csv_course_reader:
        new_course = Coursetype(name=row[0])
        db.session.add(new_course)
    db.session.commit()

with open('flaskr/static/products.csv') as productfile:
    csv_reader = csv.reader(productfile, delimiter=",")
    i = 1
    for row in csv_reader:
        current_product_id = i
        new_product = Product(name=row[0], description=row[1], shoparea=row[2], kcal=row[6])
        # loading types table of a product
        new_product_array_of_types = row[3].split(";")
        all_types_possible = Foodtype.query.all()
        for single_type in all_types_possible:
            for product_type in new_product_array_of_types:
                if (single_type.name == product_type):
                    insertStatment1 = productFoodtypes.insert().values(product_foodtype_id=single_type.id, product_id=current_product_id)
                    db.session.execute(insertStatment1)
                    db.session.commit()                        

        # loading measurents table of a product
        new_product_array_of_measurements = row[4].split(";")
        new_product_array_of_conversion_to_grams = row[5].split(";")
        all_measurements_possible = Measurement.query.all()
        for single_measurement in all_measurements_possible:
            for product_measurement in new_product_array_of_measurements:
                if (single_measurement.name == product_measurement):
                    index = new_product_array_of_measurements.index(product_measurement)
                    conversionToGramValue = new_product_array_of_conversion_to_grams[index]
                    insertStatment2 = productMeasurements.insert().values(product_measurement_id=single_measurement.id, product_id=current_product_id, product_conversion_to_gram=conversionToGramValue)
                    db.session.execute(insertStatment2)
                    db.session.commit()
        db.session.add(new_product)
        i += 1 
    db.session.commit()