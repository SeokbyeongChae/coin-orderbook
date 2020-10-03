import 'package:flutter/material.dart';
import 'package:orderbook/components/orderBook.dart';

class OrderBookScreen extends StatefulWidget {
  static const id = 'orderBookScreen';

  @override
  _OrderBookScreenState createState() => _OrderBookScreenState();
}

class _OrderBookScreenState extends State<OrderBookScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        child: Column(
          children: <Widget>[
            Expanded(
              child: OrderBook(),
            ),
          ],
        ),
      ),
    );
  }
}
