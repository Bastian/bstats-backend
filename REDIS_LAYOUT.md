# Redis Database Layout

This document describes what keys and values are used in the Redis database.

## Legend / Explanations

* Fields in hashes starting with `@` in this document are optional fields which may be null. The fields don’t really start
  with an `@`, it’s just to clarify.
* `<xyz>` in key names should be replaced with the corresponding value (e.g. `users:<username>` becomes
  `users:BtoBastian`).
* `<xyz[L]>` in key names, means that `<xyz>` is in lower case (e.g. `users:<username[L]>` becomes `users:btobastian`).
* Indexes are in the format `identifier.index.returnedvalue.parameter:<parameter>`, whereas indexes with multiple
  parameters are in the format
  `identifier.index.returnedvalue.parameter1+parameter2:<parameter1>.<parameter2>`

## Accounts

Key | Description
--- | ---
`users.usernames | A set with all usernames.
`users:<username[L]> | A hash with the following fields: "name", "password", @"admin" (true if set).
`users.index.plugins.username:<username[L]>` | A set with all plugins (ids) of the user.

## Ratelimits

Key | Description
--- | ---
`ratelimit:<identifier>.<softwareUrl>.<tms2000>` | A string. The value is the amount of requests which gets incremented for every request. The "identifier" is the ip address or the uuid. Expires after 31 minutes.

## Chart Data

Chart Type | Key | Description
--- | --- | ---
Linechart | `data:<chartUid>.<line>` | A hash. The field name is the timestamp. Not set data is interpreted as 0.
SimplePie, AdvancedPie, SimpleMap, AdvancedMap | `data:{<pluginId>}.<chartUid>.<tms2000>` | A sorted set. The score is the amount and the member the slice name. Expires after 61 minutes.
DrilldownPie "outer data" | `data:{<pluginId>}.<chartUid>.<tms2000>` | A sorted set. The score is the amount and the member the slice name. Expires after 61 minutes.
DrilldownPie "inner data" | `data:{<pluginId>}.<chartUid>.<tms2000>.>.<upperName>` | A sorted set. The score is the amount and the member the slice name. Expires after 61 minutes.
Bar Charts | `data:{<pluginId>}.<chartUid>.<tms2000>` | A hash. The field name is in the format `<featureName>:<barIndex>`.

## Structure

Key | Description
--- | ---
`plugins.ids` | A set with all plugin id
`plugins:<pluginId>` | A hash with the following fields: "name", "software", "charts" (as json array with the real ids), "owner", @"global" (true if set)
`plugins.index.id.url+name:<softwareUrl[L]>.<pluginName[L]>` | A string which stores the plugin id. Used to get the id of a plugin by software url and name.
`plugins.id-increment` | A string (in form of an integer). Increments every time a new plugin is added.
`software.ids` | A set with all software ids
`software:<softwareId>` | A hash with the following fields: "name", "url", @"globalPlugin", @"metricsClass", @"classCreation", "maxRequestsPerIp", "defaultCharts", @"hideInPluginList" (true if set)
`software.index.id.url:<url>` | A string which stores the software id. Used to get the id of the software by its url.
`software.id-increment` | A string (in form of an integer). Increments every time a new software is added.
`charts.uids` | A set with all chart uids
`charts:<chartUid>` | A hash with the following fields: "id" (the user provided one!), "type", "position", "title", "default" (true if set), "data" (as json object)
`charts.index.uid.pluginId+chartId:<pluginId>.<chartId>` | A string which stores the chart uid. Used to get the uid of a chart by plugin id and chart id.
`charts.uid-increment` | A string (in form of an integer). Increments every time a new chart is added.

## Signature Images

Key | Description
--- | ---
`signature.cache:<tms2000>.<uid> | A svg string. The uid is the unique id of the signature. At the moment it is just the plugin id.

## Cache

Key | Description
--- | ---
`history-data:<id>:<line>:<tms2000Div1000>` | A cache with the historic line data. Expires after 1 week.
