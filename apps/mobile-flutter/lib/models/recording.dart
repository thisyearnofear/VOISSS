class Recording {
  final String id;
  final String title;
  final String filePath;
  final Duration duration;
  final DateTime createdAt;
  final int fileSize;
  final List<String> tags;
  final String? ipfsHash;
  final String? starknetTxHash;

  const Recording({
    required this.id,
    required this.title,
    required this.filePath,
    required this.duration,
    required this.createdAt,
    required this.fileSize,
    required this.tags,
    this.ipfsHash,
    this.starknetTxHash,
  });

  Recording copyWith({
    String? id,
    String? title,
    String? filePath,
    Duration? duration,
    DateTime? createdAt,
    int? fileSize,
    List<String>? tags,
    String? ipfsHash,
    String? starknetTxHash,
  }) {
    return Recording(
      id: id ?? this.id,
      title: title ?? this.title,
      filePath: filePath ?? this.filePath,
      duration: duration ?? this.duration,
      createdAt: createdAt ?? this.createdAt,
      fileSize: fileSize ?? this.fileSize,
      tags: tags ?? this.tags,
      ipfsHash: ipfsHash ?? this.ipfsHash,
      starknetTxHash: starknetTxHash ?? this.starknetTxHash,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'filePath': filePath,
      'duration': duration.inMilliseconds,
      'createdAt': createdAt.toIso8601String(),
      'fileSize': fileSize,
      'tags': tags,
      'ipfsHash': ipfsHash,
      'starknetTxHash': starknetTxHash,
    };
  }

  factory Recording.fromJson(Map<String, dynamic> json) {
    return Recording(
      id: json['id'],
      title: json['title'],
      filePath: json['filePath'],
      duration: Duration(milliseconds: json['duration']),
      createdAt: DateTime.parse(json['createdAt']),
      fileSize: json['fileSize'],
      tags: List<String>.from(json['tags']),
      ipfsHash: json['ipfsHash'],
      starknetTxHash: json['starknetTxHash'],
    );
  }

  String get formattedDuration {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  String get formattedFileSize {
    if (fileSize < 1024) {
      return '${fileSize}B';
    } else if (fileSize < 1024 * 1024) {
      return '${(fileSize / 1024).toStringAsFixed(1)}KB';
    } else {
      return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)}MB';
    }
  }

  String get formattedDate {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}
