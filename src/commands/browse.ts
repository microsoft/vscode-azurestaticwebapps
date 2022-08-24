/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from '@microsoft/vscode-azext-utils';
import { QuickPickItem, QuickPickItemKind, ThemeIcon, window } from 'vscode';
import { EnvironmentTreeItem } from '../tree/EnvironmentTreeItem';
import { ResolvedStaticWebAppTreeItem } from '../tree/StaticWebAppTreeItem';

export async function browse(context: IActionContext, node?: ResolvedStaticWebAppTreeItem | EnvironmentTreeItem): Promise<void> {
    // if (!node) {
    //     node = await ext.rgApi.pickAppResource<EnvironmentTreeItem>(context, {
    //         filter: swaFilter,
    //         expectedChildContextValue: EnvironmentTreeItem.contextValue,
    //     });
    // }

    // await node.browse();
    idea5();

}


function sep(label: string): QuickPickItem {
    return {
        label,
        kind: QuickPickItemKind.Separator,
    }
}


function idea1() {
    const remote = [
        {
            label: 'Show Local Resources'
        },
        {
            label: 'Remote Resources',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];

    const local: QuickPickItem[] = [
        {
            label: 'Show Remote Resources',
        },
        {
            label: 'Local Resources',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Local resource 1',
        },
        {
            label: 'Local resource 2',
        },
        {
            label: 'Local resource 3',
        },
    ];
    const qp = window.createQuickPick();

    qp.buttons = [{
        iconPath: new ThemeIcon('folder'),
        tooltip: 'Local Resources'
    }, {
        iconPath: new ThemeIcon('globe'),
        tooltip: 'Remote Resources'
    }];

    qp.items = remote;

    qp.onDidTriggerButton((e) => {
        if (e.tooltip === 'Remote Resources') {
            qp.items = remote;
        } else {
            qp.items = local;
        }
    });

    qp.onDidAccept(() => {
        if (qp.selectedItems[0].label === 'Show Local Resources') {
            qp.items = local;
        }
        if (qp.selectedItems[0].label === 'Show Remote Resources') {
            qp.items = remote;
        }
    })

    qp.ignoreFocusOut = true;

    qp.title = "Select a Resource";

    qp.show();
}

function idea2() {

    interface QPItem extends QuickPickItem {
        id?: string;
    }

    const remote1 = [
        {
            label: 'Resources in Alex Weininger Dev subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];
    const remote2 = [
        {
            label: 'Resources in CTI Testing subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];

    const local: QuickPickItem[] = [
        {
            label: 'Local Resources',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Local resource 1',
        },
        {
            label: 'Local resource 2',
        },
        {
            label: 'Local resource 3',
        },
    ];

    const tabs: QPItem[] = [
        {
            id: 'sub1',
            label: 'Alex Weininger Dev subscription',
            description: 'Subscription',
        },
        {
            id: 'sub2',
            label: 'CTI Testing subscription',
            description: 'Subscription'
        },
        {
            id: 'local',
            label: 'Local Resources'
        }
    ];

    const defaultTab = tabs[0];

    function getTabs(selectedItem?: QPItem) {
        const tempTabs: QPItem[] = JSON.parse(JSON.stringify(tabs)) as unknown as QPItem[];
        const item = tempTabs.find((v) => v.id === selectedItem?.id);
        tempTabs.forEach((tab) => {
            if (tab !== item) {
                tab.label = '$(circle-small-filled) ' + tab.label
            } else {
                item.label = '$(circle-filled) ' + tab.label;
            }
        });

        return [
            {
                label: '',
                kind: QuickPickItemKind.Separator,
            },
            ...tempTabs
        ];
    }

    const recentPicks: QuickPickItem[] = [
        {
            label: "Recently picked",
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'test-swa-1'
        }
    ]

    const qp = window.createQuickPick<QPItem>();

    qp.items = [...recentPicks, ...getTabs(defaultTab), ...remote1];

    qp.onDidAccept(() => {
        const active = JSON.parse(JSON.stringify(qp.activeItems)) as unknown as QPItem[];
        if (qp.selectedItems[0].id === 'sub1') {
            qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0]), ...remote1];
        }
        if (qp.selectedItems[0].id === 'sub2') {
            qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0]), ...remote2];
        }
        if (qp.selectedItems[0].id === 'local') {
            qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0]), ...local];
        }
        qp.activeItems = active;
    })

    qp.ignoreFocusOut = true;

    qp.title = "Select a Resource";

    qp.show();
}

// deal with multiple subscriptions
function idea3() {
    interface QPItem extends QuickPickItem {
        id?: string;
        rawLabel?: string;
    }

    const remote1 = [
        {
            label: 'Resources in Alex Weininger Dev subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];
    const remote2 = [
        {
            label: 'Resources in CTI Testing subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];

    const local: QuickPickItem[] = [
        {
            label: 'Local Resources',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Local resource 1',
        },
        {
            label: 'Local resource 2',
        },
        {
            label: 'Local resource 3',
        },
    ];


    const subs: QPItem[] = [
        {
            id: 'sub1',
            label: 'Alex Weininger Dev subscription',
            rawLabel: 'Alex Weininger Dev subscription',
            description: 'Subscription',
        },
        {
            id: 'sub2',
            rawLabel: 'CTI Testing subscription',
            label: 'CTI Testing subscription',
            description: 'Subscription'
        },
    ]

    let currentSub = subs[0];

    const tabs: () => QPItem[] = () => [
        {
            label: currentSub.label,
            rawLabel: currentSub.label,
            id: currentSub.id,
            buttons: [
                {
                    iconPath: new ThemeIcon('edit'),
                    tooltip: 'Change subscription'
                }
            ]
        },
        {
            id: 'local',
            label: 'Local Resources',
            rawLabel: 'Local Resources',
        }
    ];


    const defaultTab = tabs()[0];

    function getTabs(selectedItem?: QPItem) {
        const tempTabs: QPItem[] = Array.from(tabs());
        const item = tempTabs.find((v) => v.id === selectedItem?.id);
        tempTabs.forEach((tab) => {
            if (tab !== item) {
                tab.label = '$(circle-small-filled) ' + tab.rawLabel!
            } else {
                item.label = '$(circle-filled) ' + tab.rawLabel!;
            }
        });

        let resources = remote1;
        if (selectedItem?.id === 'sub2') {
            resources = remote2;
        }
        if (selectedItem?.id === 'local') {
            resources = local;
        }

        return [
            {
                label: '',
                kind: QuickPickItemKind.Separator,
            },
            ...tempTabs,
            ...resources,
        ];
    }

    const recentPicks: QuickPickItem[] = [
        {
            label: "Recently picked",
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'test-swa-1'
        }
    ]

    const qp = window.createQuickPick<QPItem>();

    qp.items = [...recentPicks, ...getTabs(defaultTab)];

    qp.onDidAccept(() => {
        const active = JSON.parse(JSON.stringify(qp.activeItems)) as unknown as QPItem[];
        if (qp.selectedItems[0].id === 'sub1') {
            qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0])];
        }
        if (qp.selectedItems[0].id === 'sub2') {
            qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0])];
        }
        if (qp.selectedItems[0].id === 'local') {
            qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0])];
        }
        qp.activeItems = active;
    });

    qp.onDidTriggerItemButton(() => {
        qp.hide();
        const subQp = window.createQuickPick();
        subQp.items = subs;
        subQp.show();
        subQp.onDidAccept(() => {
            currentSub = subQp.selectedItems[0];
            subQp.hide();
            qp.items = [...recentPicks, ...getTabs(currentSub)];
            qp.show();
        })

    })


    qp.ignoreFocusOut = true;

    qp.title = "Select a Resource";

    qp.show();
}

function idea4() {
    interface QPItem extends QuickPickItem {
        id?: string;
        rawLabel?: string;
    }

    const remote1 = [
        {
            label: 'Resources in Alex Weininger Dev subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];
    const remote2 = [
        {
            label: 'Resources in CTI Testing subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];

    const local: QuickPickItem[] = [
        {
            label: 'Local Resources',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Local resource 1',
        },
        {
            label: 'Local resource 2',
        },
        {
            label: 'Local resource 3',
        },
    ];


    const subs: QPItem[] = [
        {
            id: 'sub1',
            label: 'Alex Weininger Dev subscription',
            rawLabel: 'Alex Weininger Dev subscription',
            description: 'Subscription',
        },
        {
            id: 'sub2',
            rawLabel: 'CTI Testing subscription',
            label: 'CTI Testing subscription',
            description: 'Subscription'
        },
    ]

    const currentSub = subs[0];

    const tabs: () => QPItem[] = () => [
        {
            id: 'remote',
            label: 'Remote Resources',
            rawLabel: 'Remote Resources',
        },
        {
            id: 'local',
            label: 'Local Resources',
            rawLabel: 'Local Resources',
        }
    ];


    const defaultTab = tabs()[0];

    function getTabs(selectedItem?: QPItem) {
        const tempTabs: QPItem[] = Array.from(tabs());
        const item = tempTabs.find((v) => v.id === selectedItem?.id);
        tempTabs.forEach((tab) => {
            if (tab !== item) {
                tab.label = '$(circle-small-filled) ' + tab.rawLabel!
            } else {
                item.label = '$(circle-filled) ' + tab.rawLabel!;
            }
        });

        let resources: QPItem[] = remote1;
        if (selectedItem?.id === 'remote') {
            resources = remote1;
        }
        if (selectedItem?.id === 'changeSub') {
            resources = subs;
        }
        if (selectedItem?.id === 'local') {
            resources = local;
        }
        if (selectedItem?.id === 'sub1') {
            resources = remote1;
        }
        if (selectedItem?.id === 'sub2') {
            resources = remote2;
        }

        resources = [
            {
                label: '',
                kind: QuickPickItemKind.Separator,
            },
            {
                id: 'changeSub',
                label: 'Change subscription',
                rawLabel: 'Change subscription',
                description: currentSub.label
            },
            ...resources
        ]

        return [
            {
                label: '',
                kind: QuickPickItemKind.Separator,
            },
            ...tempTabs,
            ...resources,
        ];
    }

    const recentPicks: QuickPickItem[] = [
        {
            label: 'test-swa-1',
            description: 'Recently picked'
        }
    ]

    const qp = window.createQuickPick<QPItem>();

    qp.items = [...recentPicks, ...getTabs(defaultTab)];

    qp.onDidAccept(() => {
        const active = JSON.parse(JSON.stringify(qp.activeItems)) as unknown as QPItem[];
        qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0])];
        qp.activeItems = active;
    });

    qp.ignoreFocusOut = true;

    qp.title = "Select a Resource";

    qp.show();
}


function idea5() {
    interface QPItem extends QuickPickItem {
        id?: string;
        rawLabel?: string;
    }

    const remote1 = [
        {
            label: 'Resources in Alex Weininger Dev subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];
    const remote2 = [
        {
            label: 'Resources in CTI Testing subscription',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Remote resource 1',
        },
        {
            label: 'Remote resource 2',
        },
        {
            label: 'Remote resource 3',
        },
    ];

    const local: QuickPickItem[] = [
        {
            label: 'Local Resources',
            kind: QuickPickItemKind.Separator
        },
        {
            label: 'Local resource 1',
        },
        {
            label: 'Local resource 2',
        },
        {
            label: 'Local resource 3',
        },
    ];


    const subs: QPItem[] = [
        {
            id: 'sub1',
            label: 'Alex Weininger Dev subscription',
            rawLabel: 'Alex Weininger Dev subscription'
        },
        {
            id: 'sub2',
            rawLabel: 'CTI Testing subscription',
            label: 'CTI Testing subscription'
        },
    ]

    let currentSub: QPItem | undefined = subs[0];


    const tabs: () => QPItem[] = () => [
        {
            id: 'remote',
            label: 'Remote Resources',
            rawLabel: 'Remote Resources',
        },
        {
            id: 'local',
            label: 'Local Resources',
            rawLabel: 'Local Resources',
        }
    ];

    let currentTab = tabs()[0];

    function getTabs(selectedItem?: QPItem) {
        const tempTabs: QPItem[] = Array.from(tabs());
        const item = tempTabs.find((v) => v.id === selectedItem?.id);
        if (item) {
            currentTab = item;
        }
        tempTabs.forEach((tab) => {
            if (tab.id !== currentTab.id) {
                tab.label = '$(circle-small-filled) ' + tab.rawLabel!
            } else {
                tab.label = '$(circle-filled) ' + tab.rawLabel!;
            }
        });

        let resources: QPItem[] = remote1;
        if (selectedItem?.id === 'remote') {
            currentTab = selectedItem;
            resources = remote1;
        }
        if (selectedItem?.id === 'changeSub') {
            resources = subs;
        }
        if (selectedItem?.id === 'local') {
            currentTab = selectedItem;
            resources = local;
        }
        if (selectedItem?.id?.startsWith('changeSub')) {
            currentSub = undefined;
        }

        if (selectedItem?.id === 'sub1') {
            currentSub = selectedItem;
            resources = remote1;
        }
        if (selectedItem?.id === 'sub2') {
            currentSub = selectedItem;
            resources = remote2;
        }
        if (!currentSub) {
            resources = [...subs];
        }

        resources = [
            sep(''),
            ...((currentSub && currentTab.id === 'remote') ? [
                sep('Change subscription'),
                {
                    id: 'changeSub' + currentSub.id!,
                    label: currentSub.label,
                    rawLabel: currentSub.label,
                    description: 'Subscription',
                    // buttons: [
                    //     {
                    //         iconPath: new ThemeIcon('close'),
                    //         tooltip: 'Clear subscription'
                    //     }
                    // ]
                }
            ] : []),
            ...resources
        ]

        return [
            sep(''),
            ...tempTabs,
            ...resources,
        ];
    }

    const recentPicks: QuickPickItem[] = [
        {
            label: 'test-swa-1',
            description: 'Recently picked'
        }
    ]

    const qp = window.createQuickPick<QPItem>();

    qp.items = [...recentPicks, ...getTabs(currentTab)];

    qp.onDidAccept(() => {
        const active = JSON.parse(JSON.stringify(qp.activeItems)) as unknown as QPItem[];
        qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0])];
        qp.activeItems = active;
    });

    qp.onDidTriggerItemButton((e) => {
        currentSub = undefined;
        qp.items = [...recentPicks, ...getTabs(qp.selectedItems[0])];
    });

    qp.ignoreFocusOut = true;

    qp.title = "Select a Resource";

    qp.show();
}
