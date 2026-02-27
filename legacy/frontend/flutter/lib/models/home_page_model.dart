import 'package:flutter/material.dart';

class HomePageModel extends ChangeNotifier {
  void disposeModel() {
    // Clean up resources if needed
  }
  
  @override
  void dispose() {
    disposeModel();
    super.dispose();
  }
}

T createModel<T>(BuildContext context, T Function() builder) {
  return builder();
}
