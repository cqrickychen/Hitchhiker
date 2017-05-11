import React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Tabs } from 'antd';
import { DtoResRecord } from '../../../../api/interfaces/dto_res';
import { DtoRecord } from '../../../../api/interfaces/dto_record';
import { RunResult } from '../../../../api/interfaces/dto_run_result';
import { activeTabAction, sendRequestAction, addTabAction, removeTabAction, updateRecordAction } from './action';
import './style/index.less';
import { ResponseState, State, RecordState } from '../../state';
import RequestPanel from './request_panel';
import ResPanel, { nonResPanel } from './response_panel';
import ResponseLoadingPanel from './res_loading_panel';

interface ReqResPanelStateProps {
    activeKey: string;

    recordState: RecordState[];

    responseState: ResponseState;
}

interface ReqResPanelDispatchProps {
    addTab();

    removeTab(key: string);

    activeTab(key: string);

    sendRequest(record: DtoRecord);

    onChanged(record: DtoRecord);
}

type ReqResPanelProps = ReqResPanelStateProps & ReqResPanelDispatchProps;

interface ReqResPanelState {
    reqPanelVisible: { [id: string]: boolean };

    resHeights: { [id: string]: number };
}

class ReqResPanel extends React.Component<ReqResPanelProps, ReqResPanelState> {


    reqResPanel: any;

    get responsePanel() {
        return this.activeRecordState && this.activeRecordState.isRequesting ?
            <ResponseLoadingPanel /> : (
                this.activeResponse ? (
                    this.activeResponse instanceof Error ?
                        'error' :
                        <ResPanel
                            height={this.state.resHeights[this.props.activeKey]}
                            res={this.activeResponse}
                            toggleResPanelMaximize={this.toggleReqPanelVisible}
                        />
                ) :
                    nonResPanel
            );
    }

    get activeRecordState(): RecordState {
        const recordState = this.props.recordState.find(r => r.record.id === this.props.activeKey);
        if (recordState) {
            return recordState;
        }
        throw new Error('miss active record state');
    }

    get activeRecord(): DtoRecord | DtoResRecord {
        return this.activeRecordState.record;
    }

    get activeResponse(): RunResult | Error | undefined {
        return this.props.responseState[this.props.activeKey];
    }

    constructor(props: ReqResPanelProps) {
        super(props);
        this.state = {
            reqPanelVisible: {},
            resHeights: {}
        };
    }

    updateReqPanelHeight = (reqHeight: number) => {
        this.adjustResPanelHeight(reqHeight);
    }

    adjustResPanelHeight = (reqHeight: number) => {
        if (!this.reqResPanel || !reqHeight) {
            return;
        }
        const resHeight = this.reqResPanel.clientHeight - reqHeight - 100;
        if (resHeight !== this.state.resHeights[this.props.activeKey]) {
            this.setState({ ...this.state, resHeights: { ...this.state.resHeights, [this.props.activeKey]: resHeight } });
        }
    }

    toggleReqPanelVisible = (resPanelStatus: 'up' | 'down') => {
        const status = resPanelStatus === 'up' ? true : false;
        this.setState({
            ...this.state,
            reqPanelVisible: {
                ...this.state.reqPanelVisible,
                [this.props.activeKey]: status
            }
        });
    }

    onChange = (key) => {
        const recordState = this.props.recordState.find(r => r.record.id === key);
        if (recordState) {
            this.props.activeTab(recordState.record.id);
        }
    }

    onEdit = (key, action) => {
        this[action](key);
    }

    add = () => {
        this.props.addTab();
    }

    remove = (key) => {
        this.props.removeTab(key);
    }

    setReqResPanel = (ele: any) => {
        this.reqResPanel = ele;
    }

    public render() {

        return (
            <div className="request-tab" ref={this.setReqResPanel}>
                <Tabs
                    activeKey={this.activeRecord.id}
                    type="editable-card"
                    onChange={this.onChange}
                    onEdit={this.onEdit}
                    animated={false}
                >
                    {
                        this.props.recordState.map(recordState => {
                            const { name, record, isRequesting } = recordState;
                            console.log(Object.keys(this.state.reqPanelVisible));
                            const includeKey = Object.keys(this.state.reqPanelVisible).indexOf(record.id) > -1;
                            const reqStyle = (includeKey && !this.state.reqPanelVisible[record.id]) ? { display: 'none' } : {};
                            return (
                                <Tabs.TabPane key={record.id} tab={name} closable={true}>
                                    <div className="req-res-panel">
                                        <RequestPanel
                                            style={reqStyle}
                                            activeRecord={record}
                                            sendRequest={this.props.sendRequest}
                                            isRequesting={isRequesting}
                                            onChanged={this.props.onChanged}
                                            onResize={this.updateReqPanelHeight}
                                        />
                                        {this.responsePanel}
                                    </div>
                                </Tabs.TabPane>
                            );
                        })
                    }
                </Tabs>
            </div>
        );
    }
}

const mapStateToProps = (state: State): ReqResPanelStateProps => {
    return state.collectionState;
};

const mapDispatchToProps = (dispatch: Dispatch<any>): ReqResPanelDispatchProps => {
    return {
        activeTab: (key) => dispatch(activeTabAction(key)),
        sendRequest: (record: DtoRecord) => dispatch(sendRequestAction({ record, environment: '' })),
        addTab: () => dispatch(addTabAction()),
        removeTab: (key) => dispatch(removeTabAction(key)),
        onChanged: (record) => dispatch(updateRecordAction(record))
    };
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(ReqResPanel);