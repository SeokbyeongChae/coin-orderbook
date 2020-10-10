import 'package:flutter/material.dart';
import 'package:orderbook/screens/OrderBookScreen.dart';
import 'package:provider/provider.dart';
import 'package:orderbook/data/webSocketData.dart';

class MarketListScreen extends StatefulWidget {
  static const id = 'marketListScreen';

  @override
  _MarketListScreenState createState() => _MarketListScreenState();
}

class _MarketListScreenState extends State<MarketListScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Text(context.watch<WebSocketData>().marketList == null ? '' : context.watch<WebSocketData>().marketList.length.toString()),
            Expanded(
              child: _buildListView(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildListView() {
    return ListView.builder(
      itemCount: context.watch<WebSocketData>().marketList == null ? 0 : context.watch<WebSocketData>().marketList.length,
      // itemCount: 0,
      itemBuilder: (context, index) {
        return Text(context.watch<WebSocketData>().marketList[index].toString());
      },
    );
  }
}
