/*
Copyright 2016 First People's Cultural Council

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import selectn from 'selectn';

import Nuxeo from 'nuxeo';

import StringHelpers from 'common/StringHelpers';
import BaseOperations from 'operations/BaseOperations';

export default class DocumentOperations extends BaseOperations {

  /**
  * Get a single document of a certain type based on a path and title match
  * This document may or may not contain children 
  */
  static getDocument(pathOrUid = "", type, headers = {}, params = {}) {

    let properties = this.properties;

    return new Promise(
      function(resolve, reject) {
        properties.client
        .repository()
        .fetch(pathOrUid, headers)
        .then((doc) => {
          resolve(doc);
        }).catch((error) => {

          if (error.hasOwnProperty('response')) {
            error.response.json().then(
              (jsonError) => {
                reject(StringHelpers.extractErrorMessage(jsonError));
              }
            );
          } else { 
            return reject(error || 'Could not access server');
          }
        });
    });
  }

  /**
   * Publish a document 
   */  
  static publishDocument(pathOrUid = "", params = {}) {

    let properties = this.properties;

    return new Promise(
      function(resolve, reject) {
        properties.client
        .operation('Document.PublishToSection')
        .params(params)
        .input(pathOrUid)
        .execute()        
        .then((doc) => {
          resolve(doc);
        }).catch((error) => { reject('Could not publish document.'); });
    });
  }  

  /**
  * Update a document 
  */
  static updateDocument(doc, headers = {}) {

    let properties = this.properties;

    return new Promise(
      function(resolve, reject) {
        doc.save(headers)
          .then((newDoc) => {
            if (newDoc) {
              resolve(newDoc);
            } else {
              reject('No ' + type +' found');
            }
        })
        .catch((error) => {
          error.response.json().then(
            (jsonError) => {
                reject(StringHelpers.extractErrorMessage(jsonError));
            }
          );
        });
    });
  }

  /**
  * Deletes a single document
  */
  static deleteDocument(pathOrUid = "", type, headers = {}, params = {}) {

    let properties = this.properties;

    return new Promise(
      function(resolve, reject) {
        properties.client
        .repository()
        .delete(pathOrUid, headers)
        .then((res) => {
          resolve(res);
        }).catch((error) => {

          if (error.hasOwnProperty('response')) {
            error.response.json().then(
              (jsonError) => {
                reject(StringHelpers.extractErrorMessage(jsonError));
              }
            );
          } else { 
            return reject(error || 'Could not access server');
          }
        });
    });
  }

  /**
  * Disable document
  */
  static disableDocument(pathOrUid) {

    let properties = this.properties;
    
    return new Promise(
      function(resolve, reject) {
      properties.client
      .operation('FVDisableDocument')
      .input(pathOrUid)
      .execute()
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        error.response.json().then(
          (jsonError) => {
            reject(StringHelpers.extractErrorMessage(jsonError));
          }
        );
      });
    });            
  }

  /**
  * Enable document
  */
  static enableDocument(pathOrUid) {

    let properties = this.properties;
    
    return new Promise(
      function(resolve, reject) {
      properties.client
      .operation('FVEnableDocument')
      .input(pathOrUid)
      .execute()
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        error.response.json().then(
          (jsonError) => {
            reject(StringHelpers.extractErrorMessage(jsonError));
          }
        );
      });
    });            
  }

  /**
  * Publish dialect
  */
  static publishDialect(pathOrUid) {

    let properties = this.properties;
    
    return new Promise(
      function(resolve, reject) {
      properties.client
      .operation('FVPublishDialect')
      .input(pathOrUid)
      .execute()
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        error.response.json().then(
          (jsonError) => {
            reject(StringHelpers.extractErrorMessage(jsonError));
          }
        );
      });
    });            
  }

  /**
  * Unpublish dialect
  */
  static unpublishDialect(pathOrUid) {

    let properties = this.properties;
    
    return new Promise(
      function(resolve, reject) {
      properties.client
      .operation('FVUnpublishDialect')
      .input(pathOrUid)
      .execute()
      .then((doc) => {
        resolve(doc);
      })
      .catch((error) => {
        error.response.json().then(
          (jsonError) => {
            reject(StringHelpers.extractErrorMessage(jsonError));
          }
        );
      });
    });            
  }

  /**
  * Create a document
  */
  static createDocument(parentDocPathOrId, docParams) {

    let properties = this.properties;
    
    return new Promise(
      function(resolve, reject) {
        properties.client
    	.repository()
    	.create(parentDocPathOrId, docParams, { headers: {'X-NXenrichers.document': 'breadcrumb'} })
    	.then((doc) => {
    	  resolve(doc);
    	})
    	.catch((error) => {
        error.response.json().then(
          (jsonError) => {
        	  reject(StringHelpers.extractErrorMessage(jsonError));
          }
        );
      });
    });            
  }

  /**
  * Create a document with a file attached
  */
  static createDocumentWithBlob(parentDoc, docParams, file) {

    let properties = this.properties;

    return new Promise(
      function(resolve, reject) {

        let uploadedBlob = null;

        // If file not empty, process blob and upload
        if (file) {
          let blob = new Nuxeo.Blob({
            content: file,
            name: file.name,
            mimeType: file.type,
            size: file.size
          });

          properties.client
          .batchUpload()
          .upload(blob)
          .then((res) => {
            if (res) {
              // Create document
              properties.client
              .operation('Document.Create')
              .params(docParams)
              .input(parentDoc)
              .execute()
              .then((newDoc) => {
                  // If blob uploaded, attach to created document
                  if (res != null) {
                    properties.client.operation('Blob.AttachOnDocument')
                    .param('document', newDoc.uid)
                    .input(res.blob)
                    .execute({ schemas: ['dublincore', 'file']});

                    // Finally, resolve create document
                    resolve(newDoc);
                  }
              })
              .catch((error) => { reject('Could not create document.'); } );
            } else {
                reject('No ' + type +' found');
            }
          }).catch((error) => { reject('Could not upload file.'); } );
        }
    });
  }

  /**
  * Get a single document by ID
  */
  getDocumentByID(id, headers = null, params = null) {
    // Expose fields to promise
    let client = this.client;
    let selectDefault = this.selectDefault;

    id = StringHelpers.clean(id);

    // Initialize an empty document from type
    let documentType = this.documentType;

    return new Promise(
        // The resolver function is called with the ability to resolve or
        // reject the promise
        function(resolve, reject) {

          let defaultParams = {
            query: 
              "SELECT * FROM " + documentType.prototype.entityTypeName + " WHERE (ecm:uuid='" + id + "' AND  " + selectDefault + ")"
          };

          let defaultHeaders = {};

          params = Object.assign(defaultParams, params);
          headers = Object.assign(defaultHeaders, headers);

          client.operation('Document.Query')
            .params(params)
            .execute(headers).then((response) => {      
              if (response.entries.length > 0) {
                resolve(new documentType(response.entries[0]));
              } else {
                reject('No ' + documentType.prototype.entityTypeName +' found');
              }
          }).catch((error) => { throw error });
    });
  }

  /**
  * TODO: Change to more official method if exists?
  * Get Blob, Or https://github.com/dcodeIO/protobuf.js/wiki/How-to-read-binary-data-in-the-browser-or-under-node.js%3F
  * https://github.com/request/request/issues/1796
  */
  getMediaBlobById(id, mimeType, xpath = 'file:content') {
    // Expose fields to promise
    let client = this.client;

    return new Promise(
      function(resolve, reject) {

        var request = new XMLHttpRequest();

        request.onload = function(e) {
          if (request.readyState == 4) {
              var uInt8Array = new Uint8Array(this.response);
              var i = uInt8Array.length;
              var biStr = new Array(i);
              while (i--) { 
                biStr[i] = String.fromCharCode(uInt8Array[i]);
              }
              var data = biStr.join('');
              var base64 = window.btoa(data);

            var dataUri = 'data:' + mimeType + ';base64,' + base64;
            resolve({dataUri: dataUri, mediaId: id});
          } else {
            reject("Media not found");
          }
        }

        request.open("POST", client._baseURL + "/site/automation/Blob.Get", true);
        request.responseType = "arraybuffer";
        request.setRequestHeader("authorization", "Basic " + window.btoa(unescape(encodeURIComponent(client._auth.username + ":" + client._auth.password))));
        request.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        request.setRequestHeader("Content-Type", "application/json+nxrequest");
        request.send(JSON.stringify({input: id, params: {xpath: xpath}}));

    });
  }

  getDocumentsByDialect(client, dialect, query = null, headers = null, params = null) {

    // Initialize and empty document list from type
    let documentList = new this.documentTypePlural(null);

    return new Promise(
        function(resolve, reject) {

          let defaultParams = {
            query: 
              "  SELECT * FROM " + documentList.model.prototype.entityTypeName + 
              "  WHERE (fva:dialect = '" + dialect.get('id') + 
              "' AND ecm:currentLifeCycleState <> 'deleted')" + 
                 ((query) ? (" AND " + query) : "" ) + 
              "  ORDER BY dc:title"
          };

          let defaultHeaders = {
            'X-NXenrichers.document': 'parentDoc'
          };

          params = Object.assign(defaultParams, params);
          headers = Object.assign(defaultHeaders, headers);

          client.operation('Document.Query')
            .params(params)
            .execute(headers).then((response) => {
              documentList.add(response.entries);
              resolve(documentList.toJSON());
          }).catch((error) => { throw error });
    });
  }

  /**
  * Executes an operation on the server
  */
  static executeOperation(input, operationName, operationParams, headers = {}, params = {}) {

    let sanitizeKeys = ['dialectPath'];

    let properties = this.properties;

    for (let paramKey in operationParams) {
      if (sanitizeKeys.indexOf(paramKey) !== -1) {
        operationParams[paramKey] = StringHelpers.clean(operationParams[paramKey]);
      }
    }

    return new Promise(
      function(resolve, reject) {
        let operation = properties.client
        .operation(operationName);

        if (input){
          operation = operation.input(input);
        }
        
        operation.params(operationParams)
        .execute(headers)
        .then((response) => {
          resolve(response);
        }).catch((error) => {

          if (error.hasOwnProperty('response')) {
            error.response.json().then(
              (jsonError) => {
                reject(StringHelpers.extractErrorMessage(jsonError));
              }
            );
          } else { 
            return reject(error || 'Could not execute operation "' + operationName + '"');
          }
        });
    });
  }
   
   
   static getCharactersByDialect(path, headers = {}, params = {}) {

	   let properties = this.properties;
	   let cleanedDialectPath = StringHelpers.clean(path);

	   return new Promise(
	        function(resolve, reject) {

	        let defaultParams = {
	        	query: 
	        		"SELECT * FROM FVCharacter" +
	        		" WHERE (ecm:path STARTSWITH '" + cleanedDialectPath + "'" + 
	        		" AND ecm:currentLifeCycleState <> 'deleted')" + 
	        		" ORDER BY fvcharacter:alphabet_order ASC"
	          	};

	          	params = Object.assign(defaultParams, params);

	          	properties.client.operation('Document.Query')
	            .params(params)
	            .execute(headers)
	         	.then(function(results) {
	         		resolve(results);
	        	})
	        	.catch((error) => { reject(error); });
	        });
	  }   

   static queryDocumentsByDialect(path, queryAppend, headers = {}, params = {}) {

	   let properties = this.properties;
	   let cleanedDialectPath = StringHelpers.clean(path);

	   return new Promise(
	        function(resolve, reject) {

	        let defaultParams = {
	        	query: 
	        		"SELECT * FROM Document" +
	        		" WHERE (ecm:path STARTSWITH '" + cleanedDialectPath + "'" + 
	        		" AND ecm:currentLifeCycleState <> 'deleted')" +
	        		queryAppend +
	        		" ORDER BY dc:title ASC"
	          	};
	        	
	        	console.log(defaultParams.query);
	        
	          	params = Object.assign(defaultParams, params);

	          	properties.client.operation('Document.Query')
		            .params(params)
		            .execute(headers)
		         	.then(function(results) {
		         		console.log(results);
		         		resolve(results);
		        	})
	        	.catch((error) => { reject(error); });
	        });
	  }   

   static searchDocuments(queryParam, queryPath, docTypes, headers = {}, params = {}) {

	   let properties = this.properties;
	   
	   return new Promise(
	        function(resolve, reject) {

	        let defaultParams = {
	        	query: 
	        		"SELECT * FROM Document" +
	        		" WHERE (ecm:path STARTSWITH '" + queryPath + "'" + 
	        		" AND ecm:currentLifeCycleState <> 'deleted')" +
	        		" AND ecm:primaryType IN (" + docTypes + ")" +      		
	        		" AND ecm:fulltext = '*" + queryParam + "*'" +        			        			        		
	        		" ORDER BY dc:title ASC"
	          	};
	        	
	        	console.log(defaultParams.query);	        
	          	params = Object.assign(defaultParams, params);
	            
	          	properties.client.operation('Document.Query')
		            .params(params)
		            .execute({headers: {'X-NXenrichers.document': 'ancestry'}})
		         	.then(function(results) {
		         		console.log(results);
		         		// Get the ancestry information out of the contextParameters and store it at the object root
		         		// This is necessary for the datagrid to be able to access it
		         		results.entries.map(
		         			function(entry) {
		         				entry['ancestry_family_title'] = selectn('dc:title', entry.contextParameters.ancestry.family);
		         				entry['ancestry_language_title'] = selectn('dc:title', entry.contextParameters.ancestry.language);
		         				entry['ancestry_dialect_title'] = selectn('dc:title', entry.contextParameters.ancestry.dialect);         		
		         			}
		         		);		         		
		         		resolve(results);
		        	})
	        	.catch((error) => { reject(error); });
	        });
	  }    
   
   
}