(function() {
  var DEFAULT_COLOR, Element, Link,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Element = require("./element");

  DEFAULT_COLOR = "#ff7700";

  Link = (function(_super) {
    __extends(Link, _super);

    function Link() {
      this.onClick = __bind(this.onClick, this);
      return Link.__super__.constructor.apply(this, arguments);
    }

    Link.prototype.create = function() {
      var color, geometry, geometry2, material, material2, styles;
      styles = new StyleMap(this.el.attr("style"));
      color = styles.color || DEFAULT_COLOR;
      this.obj = new THREE.Object3D;
      geometry2 = new THREE.SphereGeometry(0.25, 16, 16);
      material2 = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        transparent: true,
        opacity: 0.5
      });
      this.obj.add(new THREE.Mesh(geometry2, material2));
      geometry = new THREE.SphereGeometry(0.12, 16, 16);
      material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color
      });
      this.obj.add(new THREE.Mesh(geometry, material));
      this.obj.onClick = this.onClick;
      this.obj.body = null;
      return this.obj;
    };

    Link.prototype.onClick = function() {
      if (this.connector.portal && this.connector.portal.obj === this.obj) {
        return this.closePortal();
      } else if (this.connector.portal) {
        this.closePortal();
        return this.createPortal();
      } else {
        return this.createPortal();
      }
    };

    Link.prototype.closePortal = function() {
      return this.connector.closePortal();
    };

    Link.prototype.createPortal = function() {
      var glow, glowGeometry, glowMaterial, glowTexture, portal, portalClone, portalGeometry, portalMaterial;
      this.connector.loadPortal(this.el, this.obj);
      while (this.obj.children[0]) {
        this.obj.remove(this.obj.children[0]);
      }
      glowTexture = new THREE.ImageUtils.loadTexture('/img/portal.png');
      glowTexture.wrapS = glowTexture.wrapT = THREE.RepeatWrapping;
      glowTexture.repeat.set(1, 1);
      glowMaterial = new THREE.MeshBasicMaterial({
        map: glowTexture,
        transparent: true,
        side: THREE.DoubleSide
      });
      glowGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
      glow = new THREE.Mesh(glowGeometry, glowMaterial);
      portalMaterial = new THREE.MeshBasicMaterial({
        color: '#000000',
        side: THREE.DoubleSide
      });
      portalGeometry = new THREE.CircleGeometry(1 * 0.75, 40);
      portal = new THREE.Mesh(portalGeometry, portalMaterial);
      portal.position.z = 0.001;
      this.obj.add(glow);
      this.obj.add(portal);
      portalClone = portal.clone();
      portalClone.position.copy(this.getPosition());
      portalClone.position.z += 0.1;
      portalClone.visible = true;
      if (this.getQuaternion()) {
        portalClone.quaternion.copy(this.getQuaternion());
      }
      portalClone.updateMatrix();
      portalClone.updateMatrixWorld(true);
      portalClone.matrixAutoUpdate = false;
      portalClone.frustumCulled = false;
      return this.connector.stencilScene.add(portalClone);
    };

    return Link;

  })(Element);

  module.exports = Link;

}).call(this);
