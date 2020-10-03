import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:orderbook/common/constants.dart' as common;

class WebSocketData with ChangeNotifier {
  static const SERVER_DOMAIN = 'ws://ec2-3-133-111-6.us-east-2.compute.amazonaws.com/ws';
  // static const SERVER_DOMAIN = 'ws://10.0.2.2:4000/ws';
  WebSocketChannel channel;

  var askMap;
  var bidMap;

  WebSocketData() {
    this.connect();
  }

  void changeText(String text) {
    // this.data = 'new text: $text';
    print('change text..');
    notifyListeners();
  }

  void connect() {
    this.channel = IOWebSocketChannel.connect(SERVER_DOMAIN);
    this.channel.stream.listen((event) {
      this.messageHandler(event);
    }, onDone: () {
      print('on done..');
    });
  }

  void sendMessage(int methodType, int method, var params) {
    print('send message..');
    final data = {'type': methodType, 'method': method, 'params': params};
    final sendData = jsonEncode(data);
    this.channel.sink.add(sendData);
  }

  void messageHandler(rawMessage) {
    var methodType = jsonDecode(rawMessage)['methodType'];
    var method = jsonDecode(rawMessage)['method'];

    // print(rawMessage);
    switch (methodType) {
      case common.notification:
        {
          switch (method) {
            case common.connected:
              {
                this.sendMessage(common.subscribe, common.subscribeMarket, null);
                this.sendMessage(common.subscribe, common.subscribeOrderBook, {'market': 'ETH/BTC'});
                break;
              }
          }

          break;
        }
      case common.subscribe:
        {
          switch (method) {
            case common.subscribeMarket:
              {
                print(rawMessage);
                break;
              }
            case common.subscribeOrderBook:
              {
                print('update orderbook..');
                // print(jsonDecode(rawMessage)['data']['marketOrderBook']['askMap'][1]);
                this.askMap = jsonDecode(rawMessage)['data']['marketOrderBook']['askMap'];
                this.bidMap = jsonDecode(rawMessage)['data']['marketOrderBook']['bidMap'];

                notifyListeners();
                break;
              }
          }
          break;
        }
    }
  }
}
