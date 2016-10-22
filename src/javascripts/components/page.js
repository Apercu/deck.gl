import 'babel-polyfill';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import MapGL from 'react-map-gl';
import TWEEN from 'tween.js';

import MarkdownPage from '../components/markdown-page';
import GenericInput from './input';
import * as Demos from './demos';
import * as appActions from '../actions/app-actions';
import {MAPBOX_ACCESS_TOKEN, MAPBOX_STYLES} from '../constants/defaults';

function animate() {
  TWEEN.update();
  requestAnimationFrame(animate);
}
animate();

class Page extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...this._loadContent(props.route.content)
    };
  }

  componentDidMount() {
    window.onresize = this._resizeMap.bind(this);
    this._resizeMap();
  }

  componentWillReceiveProps(nextProps) {
    const {route} = nextProps;
    if (this.props.route !== route) {
      this.setState({
        ...this._loadContent(route.content)
      });
    }
  }

  _loadContent(content) {
    if (typeof content === 'string') {
      content = {content};
    }
    const {demo, ...docs} = content;
    const {viewport, loadData, useParams, updateMap, loadContent} = this.props;
    const DemoComponent = Demos[demo];

    if (DemoComponent) {
      loadData(demo, DemoComponent.data);
      useParams(DemoComponent.parameters);

      // fly to new viewport
      const fromViewport = {};
      const nanViewport = {};
      const toViewport = DemoComponent.viewport;
      Object.keys(toViewport).forEach(key => {
        const v = viewport[key];
        if (isNaN(v)) {
          nanViewport[key] = toViewport[key];
        } else {
          fromViewport[key] = v;
        }
      });

      TWEEN.removeAll();
      new TWEEN.Tween(fromViewport)
        .to(toViewport, 1000)
        .easing(TWEEN.Easing.Exponential.Out)
        .onUpdate(function() {
          updateMap({...this, ...nanViewport});
        })
        .start();
    }

    // grab text contents
    Object.values(docs).forEach(url => loadContent(url));

    return {
      activeTab: ('demo' in content) ? 'demo' : Object.keys(content)[0],
      tabs: content
    };
  }

  _resizeMap() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.props.updateMap({
      width: w <= 768 ? w : w - 240,
      height: h - 64
    });
  }

  _renderMap() {
    const {viewport, app: {params, owner, data}} = this.props;
    const {tabs: {demo}} = this.state;
    const DemoComponent = Demos[demo];
    const dataLoaded = owner === demo ? data : null;

    return (
      <MapGL
        mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN}
        perspectiveEnabled={true}
        { ...viewport }
        onChangeViewport={ this.props.updateMap }>

        <DemoComponent viewport={viewport} params={params}
          data={dataLoaded} />

      </MapGL>
    )
  }

  _renderOptions() {
    const {app: {params, owner, meta}} = this.props;
    const {tabs: {demo}} = this.state;
    const DemoComponent = Demos[demo];
    const metaLoaded = owner === demo ? meta : {};

    return (
      <div className="options-panel">
        { DemoComponent.renderInfo(metaLoaded) }
        { Object.keys(params).length > 0 && <hr /> }
        {
          Object.keys(params).map((name, i) => (
            <GenericInput key={i} name={name} {...params[name]}
              onChange={this.props.updateParam} />
          ))
        }
      </div>
    );
  }

  _renderTabContent(tabName, tab) {
    const {contents} = this.props;
    const {activeTab, tabs} = this.state;

    return Object.keys(tabs).map(tabName => {
      const tab = tabs[tabName];
      let child;

      if (tabName === 'demo') {
        child = (
          <div>
            { this._renderMap() }
            { this._renderOptions() }
          </div>
        )
      } else {
        child = <MarkdownPage content={contents[tab]} />;
      }

      return (
        <div key={tabName} className={`tab ${tabName === activeTab ? 'active' : ''}`}>
          { child }
        </div>
      );
    });
  }

  _renderTabs() {
    const {activeTab, tabs} = this.state;

    return (
      <ul className="tabs">
        {
          Object.keys(tabs).map(tabName => (
            <li key={tabName} className={`${tabName === activeTab ? 'active' : ''}`}>
              <button onClick={ () => this.setState({activeTab: tabName}) }>
                { tabName }
              </button>
            </li>
          ))
        }
      </ul>
    );
  }

  render() {
    const {tabs} = this.state;

    return (
      <div className="page">
        { Object.keys(tabs).length > 1 && this._renderTabs() }
        { this._renderTabContent() }
      </div>
    );
  }
}

export default connect(state => state, appActions)(Page);
