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
import React, { Component, PropTypes } from 'react';
import Immutable, { List, Map } from 'immutable';

import classNames from 'classnames';
import ConfGlobal from 'conf/local.json';
import selectn from 'selectn';

import provide from 'react-redux-provide';

import ProviderHelpers from 'common/ProviderHelpers';

import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';
import RaisedButton from 'material-ui/lib/raised-button';
import Toggle from 'material-ui/lib/toggle';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import IconButton from 'material-ui/lib/icon-button';
import NavigationExpandMoreIcon from 'material-ui/lib/svg-icons/navigation/expand-more';

import AuthorizationFilter from 'views/components/Document/AuthorizationFilter';

@provide
export default class PageToolbar extends Component {

  static defaultProps = {
    publishChangesAction: null,
    handleNavigateRequest: null,
    actions: [] // ['workflow', 'edit', 'add-child', 'publish-toggle', 'enable-toggle', 'publish', 'more-options']
  };

  static propTypes = {
    windowPath: PropTypes.string.isRequired,
    fetchTasks: PropTypes.func.isRequired,
    computeTasks: PropTypes.object.isRequired,
    computeEntity: PropTypes.object.isRequired,
    computePermissionEntity: PropTypes.object,
    computeLogin: PropTypes.object.isRequired,
    handleNavigateRequest: PropTypes.func,
    publishToggleAction: PropTypes.func,
    publishChangesAction: PropTypes.func,
    enableToggleAction: PropTypes.func,
    children: PropTypes.node,
    label: PropTypes.string,
    actions: PropTypes.array
  };

  static contextTypes = {
    muiTheme: PropTypes.object.isRequired
  };

  constructor(props, context){
    super(props, context);

    this.state = {
      enableActions: 0,
      disableActions: 0,
      publishActions: 0,
      unpublishActions: 0
    };

    // Bind methods to 'this'
    ['_documentActionsToggleEnabled', '_documentActionsTogglePublished', '_documentActionsStartWorkflow', '_publishChanges'].forEach( (method => this[method] = this[method].bind(this)) );
  }

  /**
  * Publish changes directly
  */
  _publishChanges() {
    if (this.props.publishChangesAction == null) {
      this.props.publishToggleAction(true, false, selectn('response.path', this.props.computeEntity));
    } else {
      this.props.publishChangesAction();
    }
  }

  /**
  * Toggle document (enabled/disabled)
  */
  _documentActionsToggleEnabled(event, toggled) {
    this.props.enableToggleAction(toggled, false, selectn('response.path', this.props.computeEntity));
  }

  /**
  * Toggle published document
  */
  _documentActionsTogglePublished(event, toggled) {
    this.props.publishToggleAction(toggled, false, selectn('response.path', this.props.computeEntity));
  }

  /**
  * Start a workflow
  */
  _documentActionsStartWorkflow(workflow, event) {

    const path = selectn('response.path', this.props.computeEntity);

    switch (workflow) {
      case 'enable':
        this.props.enableToggleAction(true, true, path);
        this.setState({enableActions: this.state.enableActions + 1});
      break;

      case 'disable':
        this.props.enableToggleAction(false, true, path);
        this.setState({disableActions: this.state.disableActions + 1});
      break;

      case 'publish':
        this.props.publishToggleAction(true, true, path);
        this.setState({publishActions: this.state.publishActions + 1});
      break;

      case 'unpublish':
        this.props.publishToggleAction(false, true, path);
        this.setState({unpublishActions: this.state.unpublishActions + 1});
      break;
    }
  }

  componentDidMount() {
    this.props.fetchTasks(selectn('response.uid', this.props.computeEntity));
  }

  render() {

    const { computeEntity, computePermissionEntity, computeLogin } = this.props;

    let enableTasks = [];
    let disableTasks = [];
    let publishTasks = [];
    let unpublishTasks = [];

    let toolbarGroupItem = {
      float: 'left',
      margin: `${(this.context.muiTheme.toolbar.height - this.context.muiTheme.button.height) / 2}px ${this.context.muiTheme.baseTheme.spacing.desktopGutter}px`,
      position: 'relative'
    }

    let documentEnabled = (selectn('response.state', computeEntity) == 'Enabled');
    let documentPublished = (selectn('response.state', computeEntity) == 'Published');

    const permissionEntity = (selectn('response', computePermissionEntity)) ? computePermissionEntity : computeEntity;

    // Compute related tasks
    const computeTasks = ProviderHelpers.getEntry(this.props.computeTasks, selectn('response.uid', this.props.computeEntity));

    if (selectn('response.entries', computeTasks)) {

      let taskList = new List(selectn('response.entries', computeTasks));

      taskList.forEach(function(value, key) {
        switch (selectn('properties.nt:type', value)) {
          case 'Task2300':
            enableTasks.push(value);
          break;

          case 'Task297b':
            disableTasks.push(value);
          break;

          case 'Task6b8':
            publishTasks.push(value);
          break;

          case 'Task11b1':
            unpublishTasks.push(value);
          break;
        }
      });
    }

    return <Toolbar>

                  <ToolbarGroup float="left">

                    {this.props.children}

                    {(() => {
                      if (this.props.actions.includes('workflow')) {

                          return <AuthorizationFilter filter={{role: 'Record', entity: selectn('response', permissionEntity), login: computeLogin}} style={toolbarGroupItem}>

                            <div>

                              <span style={{paddingRight: '15px'}}>REQUEST: </span>

                              <RaisedButton label={"Enable (" + (enableTasks.length + this.state.enableActions ) + ")"} disabled={selectn('response.state', computeEntity) != 'Disabled' && selectn('response.state', computeEntity) != 'New'} style={{marginRight: '5px', marginLeft: '0'}} secondary={true} onTouchTap={this._documentActionsStartWorkflow.bind(this, 'enable')} />
                              <RaisedButton label={"Disable (" + (disableTasks.length + this.state.disableActions) + ")"} disabled={selectn('response.state', computeEntity) != 'Enabled' && selectn('response.state', computeEntity) != 'New'} style={{marginRight: '5px', marginLeft: '0'}} secondary={true} onTouchTap={this._documentActionsStartWorkflow.bind(this, 'disable')} />
                              <RaisedButton label={"Publish (" + (publishTasks.length + this.state.publishActions) + ")"} disabled={selectn('response.state', computeEntity) != 'Enabled'} style={{marginRight: '5px', marginLeft: '0'}} secondary={true} onTouchTap={this._documentActionsStartWorkflow.bind(this, 'publish')} />
                              <RaisedButton label={"Unpublish (" + (unpublishTasks.length + this.state.unpublishActions) + ")"} disabled={selectn('response.state', computeEntity) != 'Published'} style={{marginRight: '5px', marginLeft: '0'}} secondary={true} onTouchTap={this._documentActionsStartWorkflow.bind(this, 'unpublish')} />

                            </div>

                          </AuthorizationFilter>;
                      }
                    })()}


                    {(() => {
                      if (this.props.actions.includes('enable-toggle')) {

                          return <AuthorizationFilter filter={{permission: 'Write', entity: selectn('response', permissionEntity)}} style={toolbarGroupItem}>
                            <div style={{display:'inline-block', float: 'left', margin: '17px 5px 10px 5px', position:'relative'}}>
                              <Toggle
                                toggled={documentEnabled || documentPublished}
                                onToggle={this._documentActionsToggleEnabled}
                                ref="enabled"
                                disabled={documentPublished}
                                name="enabled"
                                value="enabled"
                                label="Enabled"/>
                            </div>
                          </AuthorizationFilter>;
                      }
                    })()}

                    {(() => {
                      if (this.props.actions.includes('publish-toggle')) {

                          return <AuthorizationFilter filter={{permission: 'Write', entity: selectn('response', permissionEntity)}} style={toolbarGroupItem}>
                            <div style={{display:'inline-block', float: 'left', margin: '17px 5px 10px 5px', position:'relative'}}>
                              <Toggle
                                toggled={documentPublished}
                                onToggle={this._documentActionsTogglePublished}
                                disabled={!documentEnabled && !documentPublished}
                                name="published"
                                value="published"
                                label="Published"/>
                            </div>
                          </AuthorizationFilter>;
                      }
                    })()}

                  </ToolbarGroup>

                  <ToolbarGroup float="right">

                    {(() => {
                      if (this.props.actions.includes('publish')) {
                        return <AuthorizationFilter filter={{permission: 'Write', entity: selectn('response', permissionEntity)}} style={toolbarGroupItem}>
                          <RaisedButton disabled={!documentPublished} label="Publish Changes" style={{marginRight: '5px', marginLeft: '0'}} secondary={true} onTouchTap={this._publishChanges} />
                        </AuthorizationFilter>;
                      }
                    })()}

                    {(() => {
                      if (this.props.actions.includes('edit')) {
                        return <AuthorizationFilter filter={{permission: 'Write', entity: selectn('response', computeEntity)}} style={toolbarGroupItem}>
                          <RaisedButton label={"Edit " + this.props.label} style={{marginRight: '5px', marginLeft: '0'}} primary={true} onTouchTap={this.props.handleNavigateRequest.bind(this, this.props.windowPath.replace('sections', 'Workspaces') + '/edit')} />
                        </AuthorizationFilter>;
                      }
                    })()}

                    {(() => {
                      if (this.props.actions.includes('add-child')) {
                        return <AuthorizationFilter filter={{permission: 'Write', entity: selectn('response', computeEntity)}} style={toolbarGroupItem}>
                                <RaisedButton label="Add New Page" style={{marginRight: '5px', marginLeft: '0'}} onTouchTap={this.props.handleNavigateRequest.bind(this, this.props.windowPath + '/create')} primary={true} />
                        </AuthorizationFilter>;
                      }
                    })()}

                    <ToolbarSeparator />

                    {(() => {
                      if (this.props.actions.includes('more-options')) {
                        return <IconMenu anchorOrigin={{horizontal: 'right', vertical: 'top'}} targetOrigin={{horizontal: 'right', vertical: 'top'}} iconButtonElement={
                                <IconButton tooltip="More Options" tooltipPosition="top-center" touch={true}>
                                  <NavigationExpandMoreIcon />
                                </IconButton>
                              }>
                                <MenuItem onTouchTap={this.props.handleNavigateRequest.bind(this, this.props.windowPath + '/reports')} primaryText="Reports" />
                                <MenuItem onTouchTap={this.props.handleNavigateRequest.bind(this, this.props.windowPath + '/media')} primaryText="Media Browser" />
                              </IconMenu>;
                      }
                    })()}


                    
                  </ToolbarGroup>

                </Toolbar>;
  }
}
