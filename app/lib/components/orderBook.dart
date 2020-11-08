import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:orderbook/data/webSocketData.dart';

class OrderBook extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      controller: ScrollController(initialScrollOffset: 200.0),
      scrollDirection: Axis.vertical,
      child: Column(
        children: <Widget>[
          Table(
            border: TableBorder.all(),
            columnWidths: {
              0: FlexColumnWidth(2.0),
              1: FlexColumnWidth(2.0),
              2: FlexColumnWidth(3.0),
            },
            children: createOrderBookTableRow(context.watch<WebSocketData>().askMap, Colors.red[300]),
          ),
          Table(
            border: TableBorder.all(),
            columnWidths: {
              0: FlexColumnWidth(2.0),
              1: FlexColumnWidth(2.0),
              2: FlexColumnWidth(3.0),
            },
            children: createOrderBookTableRow(context.watch<WebSocketData>().bidMap, Colors.blue[400]),
          ),
        ],
      ),
    );
  }

  List<TableRow> createOrderBookTableRow(orderMap, colours) {
    if (orderMap == null) {
      return List();
    }

    return (orderMap as List)
        .map(
          (item) => TableRow(children: [
            TableCell(
              child: Container(
                color: colours,
                child: Text(
                  item[1]['bgPrice'],
                  // style: Theme.of(context).textTheme.headline4
                  // style: TextStyle(backgroundColor: colours),
                ),
                padding: EdgeInsets.all(8.0),
              ),
            ),
            TableCell(
              child: Text(item[1]['bgTotalAmount']),
            ),
            TableCell(
              child: Row(
                children: item[1]['exchangeList'].map<Widget>((i) => new Text(i.toString())).toList(),
              ),
            )
//            TableCell(
//              child: createExchangeList(
//                item[1]['exchangeList'],
//              ),
//              // child: Text(item[1]['exchangeList'][0].toString()),
//            ),
          ]),
        )
        .toList();
  }
}
