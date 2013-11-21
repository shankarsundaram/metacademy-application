// want to test parsing
define(["gc/models/editable-graph-model"], function(EditableGraphModel){

  // initialize aux testing objects
  var graphObj,
      nodes,
      idCt = 0,
      nodeIds = {
        parent: idCt++,
        grandparent: idCt++,
        uncle: idCt++,
        child: idCt++,
        cousin: idCt++
      },
      edgeIds = {
        parentToChild: idCt++,
        grandparentToParent: idCt++,
        grandparentToUncle: idCt++,
        uncleToCousin: idCt++,
        grandparentToChild: idCt++
      };
  
  var should = window.should,
      it = window.it,
      describe = window.describe;
  
  describe('Graph Creation and Editing', function(){
    var ntitle,
        parentDeps,
        parentOls,
        gpToParentEdge,
        parentToChildEdge,
        gpOls;
    
    it('should create the graph', function(){
      graphObj = new EditableGraphModel();
      
      // add nodes to graph
      for (ntitle in nodeIds) {
        if (nodeIds.hasOwnProperty(ntitle)) {
          graphObj.addNode({id: nodeIds[ntitle], title: ntitle});
        }
      }

      // add edges to graph      
      graphObj.addEdge({source: graphObj.getNode(nodeIds.parent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.parentToChild, reason: "parentToChild is the reason for the test"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.parent), id: edgeIds.grandparentToParent, reason: "grandparentToParent is the reason for the test"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.uncle), id: edgeIds.grandparentToUncle, reason: "grandparentToUncle is the reason for the test"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.uncle),
                        target: graphObj.getNode(nodeIds.cousin), id: edgeIds.uncleToCousin, reason: "uncleToCousin is the reason for the test"});


    });
    
    it('should have the correct node titles', function(){
      // test node properties -- title
      for (ntitle in nodeIds) {
        if (nodeIds.hasOwnProperty(ntitle)) {
          graphObj.getNode(nodeIds[ntitle]).get("title").should.equal(ntitle);
        }
      }
    });

    it('should be able to access the deps and ols', function(){

      // test node dependencies
      gpOls =  graphObj.getNode(nodeIds.grandparent).get("outlinks");
      parentDeps = graphObj.getNode(nodeIds.parent).get("dependencies");
      parentOls =  graphObj.getNode(nodeIds.parent).get("outlinks");
      gpToParentEdge = parentDeps.get(edgeIds.grandparentToParent);
      parentToChildEdge = parentOls.get(edgeIds.parentToChild);
    });

    it('deps and ols should have correct size', function(){
      // check size of dependencies and outlinks
      gpOls.length.should.equal(2);
      parentDeps.length.should.equal(1);
      parentOls.length.should.equal(1);
    });

    it('gp to parent edge should have correct relationships', function(){
      
      // check source and target specification for the dep
      gpToParentEdge.should.deep.equal(graphObj.getEdge(edgeIds.grandparentToParent));
      gpToParentEdge.get("source").get("title").should.equal("grandparent");
      gpToParentEdge.get("target").get("title").should.equal("parent");
    });

    it('parent to child edge should have correct relationships', function(){
      // check source and target specification for the ol
      parentToChildEdge.should.deep.equal(graphObj.getEdge(edgeIds.parentToChild));
      parentToChildEdge.get("source").get("title").should.equal("parent");
      parentToChildEdge.get("target").get("title").should.equal("child");
    });

    it('traverse from child to cousin', function(){
      graphObj.getNode(nodeIds.child)
        .get("dependencies").get(edgeIds.parentToChild).get("source") // parent
        .get("dependencies").get(edgeIds.grandparentToParent).get("source") // grandparent
        .get("outlinks").get(edgeIds.grandparentToUncle).get("target") // uncle
        .get("outlinks").get(edgeIds.uncleToCousin).get("target") // cousin
        .should.deep.equal(graphObj.getNode(nodeIds.cousin));
    });

    it('should be able to remove node', function(){
      graphObj.removeNode(nodeIds.uncle);
      should.not.exist(graphObj.getNode(nodeIds.uncle));
    });

    it('should have associated edges removed from related nodes', function(){
      should.not.exist(graphObj.getNode(nodeIds.grandparent).get("outlinks").get(edgeIds.grandparentToUncle));
      should.not.exist(graphObj.getNode(nodeIds.cousin).get("dependencies").get(edgeIds.uncleToCousin));
    });
    
    it('should be able to delete node by reference', function(){
      graphObj.removeNode(graphObj.getNode(nodeIds.cousin));
      should.not.exist(graphObj.getNode(nodeIds.cousin));
    });

    it('should have three nodes and two edges', function(){
      graphObj.get("nodes").length.should.equal(3);
      graphObj.get("edges").length.should.equal(2);
    });
    
    it('should be able to add edge between grandparent and child and propagate changes to the nodes', function(){
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.grandparentToChild});      
      graphObj.get("edges").length.should.equal(3);
      graphObj.getNode(nodeIds.grandparent).get("outlinks").get(edgeIds.grandparentToChild)
        .should.deep.equal(graphObj.getEdge(edgeIds.grandparentToChild));
      graphObj.getNode(nodeIds.child).get("dependencies").get(edgeIds.grandparentToChild)
        .should.deep.equal(graphObj.getEdge(edgeIds.grandparentToChild));
    });

    it('should be able to remove edge from grandparent to child and propagate changes to the nodes', function(){
      graphObj.removeEdge(edgeIds.grandparentToChild);
      should.not.exist(graphObj.getEdge(edgeIds.grandparentToChild));
      should.not.exist(graphObj.getNode(nodeIds.grandparent)
                       .get("outlinks").get(edgeIds.grandparentToChild));
      should.not.exist(graphObj.getNode(nodeIds.child)
                       .get("dependencies").get(edgeIds.grandparentToChild));
    });

    it('should be able to readd gp-uncle-cousin chain and gp-to-child', function(){
      graphObj.addNode({id: nodeIds.uncle, title: "uncle"});
      graphObj.addNode({id: nodeIds.cousin, title: "cousin"});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.uncle), id: edgeIds.grandparentToUncle});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.uncle),
                        target: graphObj.getNode(nodeIds.cousin), id: edgeIds.uncleToCousin});
      graphObj.addEdge({source: graphObj.getNode(nodeIds.grandparent),
                        target: graphObj.getNode(nodeIds.child), id: edgeIds.grandparentToChild});      

    });

    it('should be able to add resources to a node', function(){
      graphObj.getNode(nodeIds.parent).get("resources").add({
        title: "some title",
        location: "some loc",
        url: "http://www.example.com",
        resource_type: "example book",
        free: 0,
        core: 0,
        edition: "4",
        level: "advanced examplar",
        authors: ["Colorado Reed", "Albert Einstoon"],
        dependencies: ["some dep", "some dep 2"],
        extra: ["This is an example", "really this text doesn't matter"],
        note: ["You should enjoy making examples for tests"]
      });
    });
  });

  // TODO: add content to the nodes and edges and make sure it's reconstructed appropriately
  
  // IO test vars
  var jsonObj,
      jsonStr,
      newJsonObj,
      newGraph = new EditableGraphModel();
  
  describe('Graph IO', function(){
    describe('export graph', function(){
      it('should obtain a valid json representation of the graph', function(){
        jsonObj = graphObj.toJSON();
      });

      it('should be able to obtain a string representation of the graph', function(){
        jsonStr = JSON.stringify(jsonObj);
      });            
    });
    
    describe('import graph', function(){
      it('should be able to parse string to json', function(){
        newJsonObj = JSON.parse(jsonStr);
      });

      it('should be able to create a new graph from the json object', function(){
        newGraph.addJsonNodesToGraph(newJsonObj);
      });

      it('should have same number of nodes', function(){
        newGraph.get("nodes").length.should.equal(graphObj.get("nodes").length);
      });

      it('should have same number of edges', function(){
        newGraph.get("edges").length.should.equal(graphObj.get("edges").length);
      });

      it('should have the same nodes as the original graph', function(){
        graphObj.get("nodes").forEach(function(oldNode) {
          var node = graphObj.getNode(oldNode.id),
              attribs = oldNode.attributes,
              collFields = oldNode.collFields;
          // compare txt fields
          for (var attr in attribs) {
            if (attribs.hasOwnProperty(attr) && collFields.indexOf(attr) === -1){
              oldNode.get(attr).should.equal(node.get(attr));
            }
          }
          
          // compare dependencies and outlinks
          ["dependencies", "outlinks"].forEach(function(edgeType) {
            node.get(edgeType).forEach(function(dep) {
              var matchOldNodes = oldNode.get(edgeType).filter(function(oldDep) {
                return dep.get("source").id === oldDep.get("source").id
                  && dep.get("target").id === oldDep.get("target").id
                  && dep.get("reason") === oldDep.get("reason");
              });
              matchOldNodes.length.should.equal(1);
            });
          });

          // compare resources
          node.get("resources").forEach(function(rsrc){
            var rattrs = rsrc.attributes;
            var filtRes = oldNode.get("resources").filter(function(oldRsrc){
              for (attr in rattrs) {
                if (rattrs.hasOwnProperty(attr)) {
                  if (rsrc.get(attr) !== oldRsrc.get(attr)) {
                    return false;
                  }
                }
              }
              return true;
            });
            filtRes.length.should.equal(1);            
          });
          // TODO compare questions once the schema is figured out          
        }); // end forEach node comparison        
      }); // end it()

      it('should have the same edges as the original graph', function(){
        graphObj.get("edges").forEach(function(oldEdge) {
          var matchEdge = newGraph.get("edges").filter(function(edge) {
            if (oldEdge.id !== edge.id){ return false;}
            for (var attr in oldEdge.attributes) {
              if (oldEdge.attributes.hasOwnProperty(attr)) {
                if (oldEdge.get(attr) !== edge.get(attr) && oldEdge.get(attr).id !== oldEdge.get(attr).id) {
                  return false;
                }
              }
            }
            return true;
          });
          matchEdge.length.should.equal(1);
        });
      }); // end it()

      it('should be able to add collection elements to the newGraph', function(){
        // TODO
      });
      
    }); // end describe("import graph...
  }); // end describe ("graph IO..
}); // end define

