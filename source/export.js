/*
   export.js - Created by Michael Delong, University of Guelph for the Smart Phone Data Logger Project
 
   This is a Javascript class for exporting XML or CSV files. You must provide the constructor
   with the following parameters:
   - columns (array of strings, these would be types of data that was logged)
   - data (2D array of data from sensors at each captured time interval)
 
    The following test code provides an example of how this class should be used:
 
    var cols = ["latitude", "longitude", "x", "y", "z"];
    var data = [[72.3, 14.1, 0.0, 2.0, -4.3], [22.1, 67.3, 7.45, -4.32, 4.44]];
    var exporter = new Exporter(cols, data);
    exporter.exportCSV('testCSVFileName', ',');
    exporter.exportXML('testXMLFileName');
 */
function Exporter(columns, entries) {
    this.fileName = "";
    this.columnHeadings = columns;
    this.entries = entries;
    this.fileData = "";
}

function round(num, dec) {
    var result = parseFloat(Math.round(parseFloat(num) * Math.pow(10, parseInt(dec)))/Math.pow(10, parseInt(dec)));
    return result;
}

Exporter.prototype.buildCSVFromModels = function(delimiter, decimal_places) {
    var delim = delimiter;
    var csvData = '';

    for (var i = 0; i < this.columnHeadings.length; i++) {
        if (i == this.columnHeadings.length-1) {
            delim = '';
        }
        csvData += (this.columnHeadings[i] + delim);
    }

    csvData += "\n";
    
    _.each(this.entries, _.bind(function(entry) {
        delim = delimiter;
        for (var i = 0; i < this.columnHeadings.length; i++) {
            if (i == this.columnHeadings.length-1) {
                delim = '';
            }
            if(isNaN(entry.get(this.columnHeadings[i]))) {
                csvData += (entry.get(this.columnHeadings[i]) + delim);
            } else {
                if(entry.get(this.columnHeadings[i]) !== null) {
                    csvData += (round(entry.get(this.columnHeadings[i]), decimal_places) + delim);
                } else {
                    csvData += 0;
                }
            }
        }

        csvData += "\n";
    }, this));

    csvData += "\n";

    return csvData;
}

Exporter.prototype.buildXMLFromModels = function(sensor_name, decimal_places) {
    function htmlEncode(value){
        return $('<div/>').text(value).html();
    }
    
    var xw = new XMLWriter('UTF-8');
    xw.formatting = 'indented';//add indentation and newlines
    xw.indentChar = ' ';//indent with spaces
    xw.indentation = 4;//add 2 spaces per level

    xw.writeStartDocument( );
    xw.writeStartElement(sensor_name);
    
    _.each(this.entries, _.bind(function(entry) {
        xw.writeStartElement('entry');
        
        for (var i = 0; i < this.columnHeadings.length; i++) {
            var element;
            console.log(entry.get(this.columnHeadings[i]));
            if(isNaN(entry.get(this.columnHeadings[i]))) {
                element = entry.get(this.columnHeadings[i]);
            } else {
                if(entry.get(this.columnHeadings[i]) !== null) {
                    element = round(entry.get(this.columnHeadings[i]), decimal_places);
                } else {
                    element = 0;
                }
            }
            console.log(element);
            xw.writeElementString(this.columnHeadings[i], element + '');
        }

        xw.writeEndElement();

    }, this));
      
    xw.writeEndElement();
    xw.writeEndDocument();
    
    var data = xw.flush();
    xw.close();

    data += "\n\n";

    return htmlEncode(data);

}

Exporter.prototype.exportCSV = function(file_name, delimiter) {
    this.fileName = file_name;
    this.fileData  = this.buildCSV(delimiter);
    this.fileName += ".csv";
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, this.getFS, fail);
}

Exporter.prototype.exportXML = function(file_name) {
    this.fileName = file_name;
    this.fileData = this.buildXML();
    this.fileName += ".xml";    
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, this.getFS, fail);
}

Exporter.prototype.buildXML = function() {
    var xw = new XMLWriter('UTF-8');
    xw.formatting = 'indented';//add indentation and newlines
    xw.indentChar = ' ';//indent with spaces
    xw.indentation = 4;//add 2 spaces per level

    xw.writeStartDocument( );
    xw.writeStartElement( this.fileName );
    
    for (var i = 0; i < this.rowData.length; i++) {
        xw.writeComment('entry');
        xw.writeStartElement('entry');
        
        for (var j = 0; j < this.rowData[i].length; j++) {
            xw.writeElementString(this.columnHeadings[j], this.rowData[i][j] + "");
        }
        xw.writeEndElement();
    }
      
    xw.writeEndElement();
    xw.writeEndDocument();
    
    var data = xw.flush();
    xw.close();
    return data;
}

Exporter.prototype.buildCSV = function(delimiter) {
    var delim = delimiter;
    var csvData = "";
    
    for (var i = 0; i < this.columnHeadings.length; i++) {
        if (i == this.columnHeadings.length-1) {
            delim = '';
        }
        csvData += (this.columnHeadings[i] + delim);
    }
    
    csvData += "\n";
            
    for (var i = 0; i < this.rowData.length; i++) {
        delim = delimiter;
        for (var j = 0; j < this.rowData[i].length; j++) {
            if (j == this.rowData[i].length-1) {
                delim = '';
            }
            csvData += (this.rowData[i][j] + delim);
        }
        csvData += "\n";
    }
    
    return csvData;
}

Exporter.prototype.getFS = function(fileSystem) {
    alert("getFS");
    fileSystem.root.getFile(this.fileName, {create: true, exclusive: false}, this.createFileEntry, fail);
}

Exporter.prototype.createFileEntry = function(fileEntry) {
    alert("create file entry");
    fileEntry.createWriter(this.writeToFile, fail);
}

Exporter.prototype.writeToFile = function(writer) {
    alert("write to file");
    writer.write(this.fileData);
    this.fileData = "";
}

Exporter.prototype.fail = function(error) {
    console.log(error.code);
    this.fileData = "";
}
